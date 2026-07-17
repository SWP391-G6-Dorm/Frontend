-- SCR-42: Room Inspection assigned inspector (before Pass/Fail).
-- Hibernate ddl-auto=update also adds this; script for manual/prod DBs.

USE HomestayManagement;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.room_inspections')
      AND name = N'assigned_employee_id'
)
BEGIN
    ALTER TABLE dbo.room_inspections
        ADD assigned_employee_id UNIQUEIDENTIFIER NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'fk_ri_assigned_employee'
)
BEGIN
    ALTER TABLE dbo.room_inspections
        ADD CONSTRAINT fk_ri_assigned_employee
        FOREIGN KEY (assigned_employee_id) REFERENCES dbo.users(id);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'idx_ri_assigned_employee'
      AND object_id = OBJECT_ID(N'dbo.room_inspections')
)
BEGIN
    CREATE INDEX idx_ri_assigned_employee
        ON dbo.room_inspections (assigned_employee_id);
END
GO
