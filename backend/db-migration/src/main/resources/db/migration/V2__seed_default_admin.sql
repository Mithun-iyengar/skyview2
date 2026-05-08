INSERT INTO admins (username, password, email, active, created_at)
SELECT 'MITHUN M N', 'Mimmi123', NULL, 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE username = 'MITHUN M N'
);
