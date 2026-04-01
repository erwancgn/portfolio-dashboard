-- =============================================================================
-- SEED — Données de test Portfolio Dashboard
-- Utilisateur : test@test.com / password : test1234
-- Recréé automatiquement à chaque `supabase db reset`
-- =============================================================================

-- Utilisateur de test (mot de passe : test1234)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) VALUES (
  '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  '$2a$10$f4CEGvnP2SfhSkPL5M2QDOqjTgXQoAAeSXjT0FxNSnoH2fHxrqaxK',  -- test1234
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
  '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
  'test@test.com',
  '{"sub":"580c4bb3-0821-4765-8d0f-1aba8fdf2f59","email":"test@test.com"}',
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Positions
-- =============================================================================
INSERT INTO public.positions
  (id, user_id, ticker, name, isin, quantity, pru, current_price, currency, envelope, sector, country, type, logo_url)
VALUES
  (
    '57a3d6ad-928a-4c86-a383-46c58e83bf5f',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'MSFT', 'Microsoft Corporation', 'US5949181045',
    1.5, 330, 0, 'EUR', 'CTO', 'Technology', 'US', 'stock',
    'https://images.financialmodelingprep.com/symbol/MSFT.png'
  ),
  (
    'e9c3713a-dc05-442a-9727-e8f6e5bdef87',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'ESEE.MI', '', '',
    25, 29, 0, 'EUR', 'PEA', '', '', 'etf', ''
  ),
  (
    'd17af1c0-07ca-43b1-8612-db34308cc1d3',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'NBIS', 'Nebius Group N.V.', 'NL0009805522',
    3, 80.05, 0, 'EUR', 'PEA', 'Communication Services', 'NL', 'stock',
    'https://images.financialmodelingprep.com/symbol/NBIS.png'
  ),
  (
    '6f4b78f6-af3a-46c9-9c75-948ffd99727b',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'NVDA', 'NVIDIA Corporation', 'US67066G1040',
    3, 154, 0, 'EUR', 'CTO', 'Technology', 'US', 'stock',
    'https://images.financialmodelingprep.com/symbol/NVDA.png'
  ),
  (
    'fe74659d-c05f-48eb-a750-66b92a578b3e',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'DG.PA', 'Vinci S.A.', 'FR0000125486',
    2, 115, 0, 'EUR', 'PEA', 'Industrials', 'FR', 'stock',
    'https://images.financialmodelingprep.com/symbol/DG.PA.png'
  ),
  (
    '69ba6f4d-1124-487c-b9ea-f11aa22746fd',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'IE000I8KRLL9.SG', '', '',
    16, 10.6, 0, 'EUR', 'CTO', '', '', 'etf', ''
  ),
  (
    'da340413-cbe6-4c0b-85e7-70d605051166',
    '580c4bb3-0821-4765-8d0f-1aba8fdf2f59',
    'ESE.PA', 'BNP Paribas Easy S&P 500 UCITS ETF', 'FR0011550185',
    25, 29, 0, 'EUR', 'PEA', 'Financial Services', 'FR', 'etf',
    'https://images.financialmodelingprep.com/symbol/ESE.PA.png'
  )
ON CONFLICT (id) DO NOTHING;
