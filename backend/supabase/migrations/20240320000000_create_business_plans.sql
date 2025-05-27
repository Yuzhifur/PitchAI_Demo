-- Create business_plans table
CREATE TABLE IF NOT EXISTS business_plans (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    upload_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS idx_business_plans_project_id ON business_plans(project_id);

-- Create index on upload_time
CREATE INDEX IF NOT EXISTS idx_business_plans_upload_time ON business_plans(upload_time);

-- Add RLS policies
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own business plans
CREATE POLICY "Users can view their own business plans"
    ON business_plans
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert their own business plans
CREATE POLICY "Users can insert their own business plans"
    ON business_plans
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to update their own business plans
CREATE POLICY "Users can update their own business plans"
    ON business_plans
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE user_id = auth.uid()
        )
    ); 