# Supabase Setup Guide

## 🚀 Setting up Supabase for File Management Software

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `file-management-software`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
6. Click "Create new project"

### Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### Step 3: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Create Database Tables

#### Option A: Using Supabase Dashboard

1. Go to **Table Editor** in your Supabase dashboard
2. Create the `persons` table:

```sql
CREATE TABLE persons (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(100) NOT NULL,
  list_number VARCHAR(100) NOT NULL UNIQUE,
  receipt_number VARCHAR(100) NOT NULL,
  register_number VARCHAR(100) NOT NULL,
  request_name VARCHAR(255) NOT NULL,
  files TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Create the `sms_history` table:

```sql
CREATE TABLE sms_history (
  id BIGSERIAL PRIMARY KEY,
  to_number VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  delivery_status VARCHAR(50) NOT NULL,
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Option B: Using API Endpoint

After setting environment variables, call:
```bash
POST https://your-app.vercel.app/api/init-supabase
```

### Step 5: Set Row Level Security (RLS)

1. Go to **Authentication** → **Policies**
2. For the `persons` table, add policy:
   ```sql
   CREATE POLICY "Enable read access for all users" ON persons FOR SELECT USING (true);
   CREATE POLICY "Enable insert access for all users" ON persons FOR INSERT WITH CHECK (true);
   CREATE POLICY "Enable update access for all users" ON persons FOR UPDATE USING (true);
   CREATE POLICY "Enable delete access for all users" ON persons FOR DELETE USING (true);
   ```

3. For the `sms_history` table, add policy:
   ```sql
   CREATE POLICY "Enable read access for all users" ON sms_history FOR SELECT USING (true);
   CREATE POLICY "Enable insert access for all users" ON sms_history FOR INSERT WITH CHECK (true);
   ```

### Step 6: Deploy Your Application

```bash
git add .
git commit -m "Add Supabase integration"
git push
vercel --prod
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### API Endpoints

- `GET /api/persons` - Get all persons
- `POST /api/persons` - Add new person
- `GET /api/persons/search?term=...` - Search persons
- `PUT /api/persons/[id]` - Update person
- `DELETE /api/persons/[id]` - Delete person
- `POST /api/send-sms` - Send SMS
- `GET /api/sms-history` - Get SMS history

## 🎉 Benefits of Supabase

- ✅ **Real-time subscriptions** - Get live updates
- ✅ **Built-in authentication** - User management
- ✅ **File storage** - Store documents and images
- ✅ **Database backups** - Automatic backups
- ✅ **SQL editor** - Direct database access
- ✅ **API generation** - Auto-generated APIs
- ✅ **Dashboard** - Visual data management

## 🚨 Troubleshooting

### Common Issues

1. **"relation does not exist"**
   - Tables not created yet
   - Run the initialization endpoint

2. **"Invalid API key"**
   - Check your environment variables
   - Ensure you're using the anon key, not service role key

3. **"RLS policy violation"**
   - Enable RLS policies for your tables
   - Check policy permissions

### Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues) 