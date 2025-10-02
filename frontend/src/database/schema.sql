-- LexiGraph Database Schema
-- This file contains the complete database schema for the LexiGraph application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    credits_remaining INTEGER DEFAULT 10,
    total_generations INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Generations Table
CREATE TABLE IF NOT EXISTS image_generations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL CHECK (LENGTH(prompt) >= 1 AND LENGTH(prompt) <= 2000),
    negative_prompt TEXT,
    style TEXT NOT NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    image_url TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    generation_time_ms INTEGER,
    seed INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates Table
CREATE TABLE IF NOT EXISTS templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    negative_prompt_template TEXT,
    default_parameters JSONB NOT NULL DEFAULT '{}',
    preview_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    default_style TEXT,
    default_parameters JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation History View (for analytics)
CREATE OR REPLACE VIEW generation_analytics AS
SELECT 
    user_id,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_generations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_generations,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_generations,
    AVG(generation_time_ms) as avg_generation_time,
    ARRAY_AGG(DISTINCT style) as styles_used
FROM image_generations 
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON image_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_generations_status ON image_generations(status);
CREATE INDEX IF NOT EXISTS idx_image_generations_style ON image_generations(style);
CREATE INDEX IF NOT EXISTS idx_image_generations_is_public ON image_generations(is_public);
CREATE INDEX IF NOT EXISTS idx_image_generations_is_favorite ON image_generations(is_favorite);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Image Generations Policies
CREATE POLICY "Users can view own generations" ON image_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public generations" ON image_generations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own generations" ON image_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON image_generations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON image_generations
    FOR DELETE USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates Policies
CREATE POLICY "Everyone can view active templates" ON templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates" ON templates
    FOR UPDATE USING (auth.uid() = created_by);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_generations_updated_at BEFORE UPDATE ON image_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default templates
INSERT INTO templates (name, description, category, prompt_template, negative_prompt_template, default_parameters, is_active, is_premium) VALUES
('Professional Portrait', 'High-quality professional headshot style', 'Portrait', 'professional headshot, business attire, clean background, high quality, detailed face', 'blurry, low quality, amateur, casual clothing', '{"width": 512, "height": 512, "steps": 30, "guidance_scale": 7.5}', true, false),
('Artistic Landscape', 'Beautiful landscape with artistic flair', 'Landscape', 'beautiful landscape, artistic style, vibrant colors, detailed scenery', 'ugly, distorted, low quality', '{"width": 768, "height": 512, "steps": 25, "guidance_scale": 8.0}', true, false),
('Fantasy Character', 'Fantasy-themed character design', 'Character', 'fantasy character, detailed armor, magical elements, epic pose', 'modern clothing, realistic, boring', '{"width": 512, "height": 768, "steps": 35, "guidance_scale": 9.0}', true, true),
('Product Photography', 'Clean product shots for e-commerce', 'Product', 'product photography, white background, professional lighting, high detail', 'cluttered background, poor lighting, blurry', '{"width": 512, "height": 512, "steps": 20, "guidance_scale": 6.5}', true, false),
('Abstract Art', 'Modern abstract artistic style', 'Abstract', 'abstract art, modern style, vibrant colors, geometric shapes', 'realistic, photographic, boring', '{"width": 512, "height": 512, "steps": 30, "guidance_scale": 8.5}', true, false)
ON CONFLICT DO NOTHING;
