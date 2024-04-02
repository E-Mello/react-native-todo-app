-- Create table
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE
);

-- Insert
INSERT INTO tasks (id, title, description, completed) VALUES 
('43db390c-ce37-43af-955f-b2166d6746ed', 'Curupira', 'Estou testando', FALSE);