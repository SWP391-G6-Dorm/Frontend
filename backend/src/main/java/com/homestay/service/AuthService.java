package com.homestay.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.homestay.dto.request.*;
import com.homestay.dto.response.AuthResponse;
import com.homestay.entity.RefreshToken;
import com.homestay.entity.User;
import com.homestay.exception.AccountNotVerifiedException;
import com.homestay.exception.BusinessException;
import com.homestay.exception.OtpExpiredException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.RefreshTokenRepository;
import com.homestay.repository.UserRepository;
import com.homestay.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${app.google.client-id}")
    private String googleClientId;

    /** Prefer MAIL_USERNAME so From matches the SMTP authenticated account (required by Gmail). */
    @Value("${MAIL_USERNAME:${spring.mail.username:}}")
    private String mailFrom;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.mailSender = mailSender;
    }

    // ── Đăng ký bằng email ────────────────────────────────────────────────────

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã được đăng ký. Vui lòng dùng email khác.");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.CUSTOMER);
        user.setStatus(User.Status.INACTIVE);

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), otp, "Xác thực tài khoản");
    }

    @Transactional
    public void verifyOtp(OtpVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        validateOtp(user, request.getOtpCode());

        user.setStatus(User.Status.ACTIVE);
        user.setOtpCode(null);
        user.setOtpExpiredAt(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        if (user.getStatus() == User.Status.ACTIVE) {
            throw new BusinessException("Tài khoản đã được kích hoạt rồi");
        }

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), otp, "Gửi lại mã xác thực");
    }

    // ── Đăng nhập bằng email/mật khẩu ───────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Email hoặc mật khẩu không đúng"));

        if (user.getPasswordHash() == null) {
            throw new BusinessException("Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút 'Đăng nhập với Google'.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Email hoặc mật khẩu không đúng");
        }

        checkAccountStatus(user);
        return buildAuthResponse(user);
    }

    // ── Đăng nhập bằng Google ────────────────────────────────────────────────

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        // Verify ID Token với Google server
        GoogleIdToken.Payload payload = verifyGoogleToken(request.getIdToken());

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String fullName = (String) payload.get("name");
        String avatar   = (String) payload.get("picture");

        // Tìm user theo googleId hoặc email
        Optional<User> existingByGoogleId = userRepository.findByGoogleId(googleId);
        Optional<User> existingByEmail    = userRepository.findByEmail(email);

        User user;

        if (existingByGoogleId.isPresent()) {
            // Đã từng đăng nhập Google -> dùng user này
            user = existingByGoogleId.get();

        } else if (existingByEmail.isPresent()) {
            // Email đã tồn tại (đăng ký bằng form) -> liên kết Google vào
            user = existingByEmail.get();
            user.setGoogleId(googleId);
            if (user.getAvatarUrl() == null) {
                user.setAvatarUrl(avatar);
            }
            userRepository.save(user);

        } else {
            // Người dùng mới -> tự động tạo account ACTIVE (Google đã xác thực email)
            user = new User();
            user.setFullName(fullName != null ? fullName : email);
            user.setEmail(email);
            user.setGoogleId(googleId);
            user.setAvatarUrl(avatar);
            user.setRole(User.Role.CUSTOMER);
            user.setStatus(User.Status.ACTIVE); // Google đã xác thực rồi
            userRepository.save(user);
        }

        checkAccountStatus(user);
        return buildAuthResponse(user);
    }

    // ── Quên/Đặt lại mật khẩu ───────────────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        // Không cho reset password với tài khoản Google (không có passwordHash)
        if (user.getPasswordHash() == null) {
            throw new BusinessException(
                "Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút 'Đăng nhập với Google'.");
        }

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), otp, "Đặt lại mật khẩu");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        validateOtp(user, request.getOtpCode());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setOtpCode(null);
        user.setOtpExpiredAt(null);
        userRepository.save(user);

        // Thu hồi tất cả refresh token khi đổi mật khẩu
        refreshTokenRepository.revokeAllByUser(user);
    }

    // ── Refresh / Logout ─────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token không hợp lệ"));

        if (!token.isValid()) {
            throw new BusinessException("Refresh token đã hết hạn hoặc bị thu hồi");
        }

        // Rotation: thu hồi token cũ
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);

        return buildAuthResponse(token.getUser());
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevokedAt(LocalDateTime.now());
                    refreshTokenRepository.save(token);
                });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    // Verify Google ID Token với Google server
    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new BusinessException("Google token không hợp lệ hoặc đã hết hạn");
            }
            return googleIdToken.getPayload();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Xác thực Google thất bại: " + e.getMessage());
        }
    }

    // Kiểm tra trạng thái tài khoản trước khi đăng nhập
    private void checkAccountStatus(User user) {
        if (user.getStatus() == User.Status.INACTIVE) {
            // Tự động gửi lại OTP để người dùng có thể xác thực ngay
            String otp = generateOtp();
            user.setOtpCode(otp);
            user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);
            sendOtpEmail(user.getEmail(), otp, "Xác thực tài khoản");

            throw new AccountNotVerifiedException(user.getEmail());
        }
        if (user.getStatus() == User.Status.SUSPENDED) {
            throw new BusinessException("Tài khoản đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.");
        }
    }

    // Tạo access token + refresh token, trả về AuthResponse
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(30));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshToken.getToken(),
                AuthResponse.fromUser(user));
    }

    // Kiểm tra OTP đúng và còn hạn
    // OTP sai → 400 BusinessException | OTP hết hạn → 410 OtpExpiredException
    private void validateOtp(User user, String otpCode) {
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            throw new BusinessException("Mã OTP không đúng. Vui lòng kiểm tra lại.");
        }
        if (user.getOtpExpiredAt() == null || LocalDateTime.now().isAfter(user.getOtpExpiredAt())) {
            throw new OtpExpiredException("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
        }
    }

    // Sinh OTP 6 chữ số
    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    // Gửi email chứa OTP — failure must surface so register/resend do not look successful
    private void sendOtpEmail(String to, String otp, String subject) {
        String from = resolveMailFrom();
        if (!StringUtils.hasText(from) || "no-reply@dev.local".equalsIgnoreCase(from.trim())) {
            throw new BusinessException(
                    "Không gửi được email OTP: SMTP chưa cấu hình. "
                            + "Đặt MAIL_USERNAME và MAIL_PASSWORD (Gmail App Password) trong file .env ở thư mục gốc dự án, rồi khởi động lại backend.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from.trim());
            helper.setTo(to);
            helper.setSubject("[Homestay] " + subject);
            helper.setText(
                    "Xin chào,\n\n"
                            + "Mã xác thực của bạn là: " + otp + "\n"
                            + "Mã có hiệu lực trong 10 phút.\n"
                            + "Vui lòng không chia sẻ mã này với ai.\n\n"
                            + "Trân trọng,\nĐội ngũ Homestay",
                    false
            );
            mailSender.send(message);
            log.info("OTP email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new BusinessException(
                    "Không gửi được email OTP. Kiểm tra MAIL_USERNAME / MAIL_PASSWORD "
                            + "(Google cần App Password 16 ký tự) và MAIL_HOST nếu không dùng Gmail/Workspace.");
        }
    }

    private String resolveMailFrom() {
        if (StringUtils.hasText(mailFrom) && !"no-reply@dev.local".equalsIgnoreCase(mailFrom.trim())) {
            return mailFrom.trim();
        }
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl
                && StringUtils.hasText(impl.getUsername())) {
            return impl.getUsername().trim();
        }
        return mailFrom;
    }
}
