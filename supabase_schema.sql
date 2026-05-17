-- ==========================================
-- ClaimSG.auto Database Schema
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Linked to Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultimate')),
  is_golden_supporter BOOLEAN DEFAULT FALSE,
  is_silver_supporter BOOLEAN DEFAULT FALSE,
  silver_expires_at TIMESTAMP WITH TIME ZONE,
  whatsapp_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own whatsapp phone" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. USER PREFERENCES TABLE
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  genres TEXT[] DEFAULT '{}',
  price_type TEXT DEFAULT 'discount75' CHECK (price_type IN ('free_only', 'discount90', 'discount80', 'discount75', 'all')),
  min_rating INTEGER DEFAULT 70 CHECK (min_rating >= 0 AND min_rating <= 100),
  chat_history JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can read own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. GAMES CACHE TABLE
CREATE TABLE public.games_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL UNIQUE,
  game_name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('steam', 'epic')) NOT NULL,
  store_url TEXT NOT NULL,
  game_image TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  rating INTEGER DEFAULT 70 CHECK (rating >= 0 AND rating <= 100),
  genres TEXT[] DEFAULT '{}',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for games_cache (Publicly readable, updated by service_role)
ALTER TABLE public.games_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games cache is publicly readable" 
  ON public.games_cache FOR SELECT 
  TO authenticated, anon
  USING (TRUE);

-- 4. DAILY PICKS TABLE
CREATE TABLE public.daily_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('steam', 'epic')) NOT NULL,
  store_url TEXT NOT NULL,
  game_image TEXT,
  discount_percent INTEGER NOT NULL,
  rating INTEGER DEFAULT 70,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for daily_picks
ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_picks
CREATE POLICY "Users can view own daily picks" 
  ON public.daily_picks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily picks" 
  ON public.daily_picks FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. TREASURE ALERTS TABLE
CREATE TABLE public.treasure_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('steam', 'epic')) NOT NULL,
  store_url TEXT NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for treasure_alerts
ALTER TABLE public.treasure_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treasure_alerts
CREATE POLICY "Users can view own treasure alerts" 
  ON public.treasure_alerts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own treasure alerts" 
  ON public.treasure_alerts FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. SILVER AD CLICKS TABLE
CREATE TABLE public.silver_ad_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  click_date DATE DEFAULT CURRENT_DATE NOT NULL,
  ad1_clicked BOOLEAN DEFAULT FALSE,
  ad2_clicked BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, click_date)
);

-- Enable RLS for silver_ad_clicks
ALTER TABLE public.silver_ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for silver_ad_clicks
CREATE POLICY "Users can view own ad clicks" 
  ON public.silver_ad_clicks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad clicks" 
  ON public.silver_ad_clicks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad clicks" 
  ON public.silver_ad_clicks FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. GOLDEN PAYMENTS TABLE
CREATE TABLE public.golden_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for golden_payments
ALTER TABLE public.golden_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for golden_payments
CREATE POLICY "Users can view own golden payments" 
  ON public.golden_payments FOR SELECT 
  USING (auth.uid() = user_id);

-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ========================================================

-- Create a function that inserts a row into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan, is_golden_supporter, is_silver_supporter)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    FALSE,
    FALSE
  );
  
  -- Pre-initialize user preferences
  INSERT INTO public.user_preferences (user_id, genres, price_type, min_rating)
  VALUES (
    NEW.id,
    '{}',
    'discount75',
    70
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


