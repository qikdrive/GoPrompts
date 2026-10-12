-- GoPrompts demo seed. Run AFTER the init migration.
-- Creates demo users (they cannot log in: no password), creators' listings, and a few verified reviews.

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'promptsmith@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"promptsmith","name":"Maya Chen"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'pixelalchemy@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"pixelalchemy","name":"Diego Ramos"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'devdrafts@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"devdrafts","name":"Sam Okafor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'founderkit@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"founderkit","name":"Priya Nair"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'studylab@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"studylab","name":"Alex Kim"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000100', 'authenticated', 'authenticated', 'jordan.b@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"jordan_b","name":"jordan_b"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'lena.m@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"lena_m","name":"lena_m"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'kai.art@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"kai_art","name":"kai_art"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'nina.dev@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"nina_dev","name":"nina_dev"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000104', 'authenticated', 'authenticated', 'omar.vc@demo.goprompts.dev', '', now(),
   '{"provider":"email","providers":["email"]}', '{"handle":"omar_vc","name":"omar_vc"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

update public.profiles set bio = 'Growth marketer turned prompt engineer. I build prompts that write copy people actually click.', avatar_hue = 265, verified = true, created_at = '2025-02-14' where id = '00000000-0000-4000-8000-000000000001';
update public.profiles set bio = 'Concept artist. Midjourney and SD prompts for cinematic, consistent visuals.', avatar_hue = 190, verified = true, created_at = '2025-04-02' where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set bio = 'Senior engineer. Prompts for code review, refactoring, test generation and docs.', avatar_hue = 140, verified = false, created_at = '2025-06-20' where id = '00000000-0000-4000-8000-000000000003';
update public.profiles set bio = 'Two-time founder. Business plans, pitch decks and investor emails in minutes.', avatar_hue = 25, verified = true, created_at = '2025-01-09' where id = '00000000-0000-4000-8000-000000000004';
update public.profiles set bio = 'Teacher and learning designer. Prompts that turn any topic into a lesson.', avatar_hue = 330, verified = false, created_at = '2025-08-11' where id = '00000000-0000-4000-8000-000000000005';

insert into public.prompts (id, creator_id, slug, title, description, category, model, tags, variables, price_cents, cover_hue, status, featured, views, created_at) values
  ('00000000-0000-4000-8000-000000001000', '00000000-0000-4000-8000-000000000001', 'viral-linkedin-post-generator', 'Viral LinkedIn Post Generator', 'Turn one idea into a scroll-stopping LinkedIn post with a strong hook, story arc and call to action. Tuned on 500+ high-performing posts.', 'marketing', 'ChatGPT', array['linkedin', 'social media', 'copywriting']::text[], array['topic', 'audience', 'tone']::text[], 499, 265, 'live', true, 22100, '2026-03-10'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000002', 'cinematic-portrait-photography', 'Cinematic Portrait Photography', 'Hyper-realistic cinematic portraits with film grain, moody lighting and shallow depth of field. Works for any subject and setting.', 'photography', 'Midjourney', array['portrait', 'cinematic', 'photorealistic']::text[], array['subject', 'setting', 'mood']::text[], 399, 190, 'live', true, 18400, '2026-04-18'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000003', 'senior-code-reviewer', 'Senior Code Reviewer', 'Get a thorough, senior-level code review: bugs, security issues, performance problems and readability, ranked by severity with fixes.', 'coding', 'Claude', array['code review', 'security', 'refactoring']::text[], array['language', 'code']::text[], 699, 140, 'live', true, 9300, '2026-05-02'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000004', 'investor-ready-pitch-deck', 'Investor-Ready Pitch Deck Outline', 'A 12-slide pitch deck outline with narrative, key metrics and speaker notes, structured the way top VCs expect.', 'business', 'ChatGPT', array['startup', 'pitch deck', 'fundraising']::text[], array['startup', 'problem', 'stage']::text[], 999, 25, 'live', true, 12000, '2026-02-21'),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000001', 'seo-blog-article-writer', 'SEO Blog Article Writer', 'Long-form, SEO-optimized blog posts with H2/H3 structure, FAQ section and meta description that rank and read naturally.', 'writing', 'Claude', array['seo', 'blog', 'content']::text[], array['keyword', 'audience', 'length']::text[], 599, 285, 'live', false, 15800, '2026-06-11'),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000002', 'isometric-3d-icons', 'Isometric 3D Icon Set', 'Cute, glossy isometric 3D icons with consistent lighting and colors, perfect for apps, landing pages and decks.', 'art', 'Midjourney', array['icons', '3d', 'isometric']::text[], array['object', 'color']::text[], 299, 205, 'live', false, 17200, '2026-05-28'),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000003', 'unit-test-generator', 'Unit Test Generator', 'Generate complete unit test suites with edge cases, mocks and clear test names for any function or module.', 'coding', 'ChatGPT', array['testing', 'tdd', 'jest']::text[], array['framework', 'code']::text[], 0, 160, 'live', false, 8100, '2026-07-14'),
  ('00000000-0000-4000-8000-000000001007', '00000000-0000-4000-8000-000000000004', 'cold-email-that-converts', 'Cold Email That Converts', 'Personalized B2B cold emails under 120 words with a clear value prop and soft CTA. Includes 2 follow-ups.', 'marketing', 'Claude', array['sales', 'email', 'outreach']::text[], array['product', 'prospect_role', 'pain_point']::text[], 449, 15, 'live', false, 7600, '2026-08-03'),
  ('00000000-0000-4000-8000-000000001008', '00000000-0000-4000-8000-000000000005', 'lesson-plan-builder', 'Interactive Lesson Plan Builder', 'Turn any topic into a 45-minute lesson plan with objectives, activities, a quiz and differentiation tips.', 'education', 'Gemini', array['teaching', 'lesson plan', 'quiz']::text[], array['topic', 'grade']::text[], 349, 330, 'live', false, 4800, '2026-08-20'),
  ('00000000-0000-4000-8000-000000001009', '00000000-0000-4000-8000-000000000002', 'anime-character-sheet', 'Anime Character Design Sheet', 'Full character reference sheets with front, side and back views, expressions and color palette, in a clean anime style.', 'art', 'Stable Diffusion', array['anime', 'character design', 'concept art']::text[], array['character', 'outfit']::text[], 549, 350, 'live', false, 13900, '2026-09-05'),
  ('00000000-0000-4000-8000-000000001010', '00000000-0000-4000-8000-000000000005', 'weekly-planner-coach', 'Weekly Planner & Focus Coach', 'Turn a messy to-do list into a prioritized weekly plan with time blocks, using the Eisenhower matrix.', 'productivity', 'ChatGPT', array['planning', 'time management', 'focus']::text[], array['tasks', 'hours_per_day']::text[], 199, 50, 'live', false, 5100, '2026-09-18'),
  ('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000000001', 'product-launch-video-script', 'Product Launch Video Shots', 'Shot-by-shot prompts for a 30-second product launch video with camera moves, lighting and transitions.', 'marketing', 'Sora', array['video', 'product launch', 'ads']::text[], array['product', 'vibe']::text[], 799, 240, 'live', false, 6200, '2026-10-01')
on conflict (id) do nothing;

insert into public.prompt_secrets (prompt_id, template) values
  ('00000000-0000-4000-8000-000000001000', 'You are a top 1% LinkedIn ghostwriter. Write a post about {topic} for {audience} in a {tone} tone. Start with a one-line hook under 12 words. Use short paragraphs, one personal story beat, and end with a question that invites comments. No hashtags in the body; add 3 relevant hashtags at the end.'),
  ('00000000-0000-4000-8000-000000001001', 'cinematic portrait of {subject} in {setting}, {mood} atmosphere, shot on ARRI Alexa, 85mm lens, f/1.4, rim light, volumetric haze, Kodak Portra 400 film grain, ultra detailed skin texture --ar 4:5 --style raw --v 7'),
  ('00000000-0000-4000-8000-000000001002', 'Act as a staff engineer reviewing {language} code. Review the code below for correctness, security, performance and readability. Output a table of findings ranked by severity (critical, high, medium, low) with line references and a concrete fix for each.

{code}'),
  ('00000000-0000-4000-8000-000000001003', 'You are a partner at a top-tier VC firm. Create a 12-slide pitch deck outline for {startup}, which solves {problem}, raising a {stage} round. For each slide give a title, 3 bullet points and speaker notes. Follow: Problem, Solution, Why Now, Market, Product, Traction, Business Model, Competition, Go-to-Market, Team, Financials, Ask.'),
  ('00000000-0000-4000-8000-000000001004', 'Write a {length}-word SEO blog article targeting the keyword ''{keyword}'' for {audience}. Include a meta description under 155 characters, an engaging intro, H2/H3 structure, a FAQ section with 4 questions, and a conclusion with a CTA. Use the keyword naturally 4–6 times.'),
  ('00000000-0000-4000-8000-000000001005', 'isometric 3D icon of {object}, glossy clay material, soft studio lighting, {color} pastel palette, centered on plain background, Blender render, high detail --ar 1:1 --v 7'),
  ('00000000-0000-4000-8000-000000001006', 'Write a complete {framework} unit test suite for the code below. Cover the happy path, edge cases, error handling and boundary values. Use descriptive test names and mock external dependencies.

{code}'),
  ('00000000-0000-4000-8000-000000001007', 'Write a cold email under 120 words selling {product} to a {prospect_role} whose main pain is {pain_point}. Personal opening line, one-sentence value prop, one proof point, soft CTA. Then write 2 short follow-ups sent 3 and 7 days later.'),
  ('00000000-0000-4000-8000-000000001008', 'Create a 45-minute lesson plan on {topic} for grade {grade}. Include learning objectives, a 5-minute hook, two activities, a 5-question quiz with answers, and tips for advanced and struggling students.'),
  ('00000000-0000-4000-8000-000000001009', 'character reference sheet, {character}, wearing {outfit}, front view, side view, back view, 4 facial expressions, color palette swatches, clean lineart, anime style, white background, masterpiece, best quality'),
  ('00000000-0000-4000-8000-000000001010', 'Act as a productivity coach. Sort these tasks with the Eisenhower matrix, then build a Monday–Friday plan with time blocks assuming {hours_per_day} focused hours per day. Tasks: {tasks}'),
  ('00000000-0000-4000-8000-000000001011', 'Create 6 sequential video shots for a 30-second launch of {product} with a {vibe} vibe. For each shot: duration, camera movement, lighting, subject action and transition into the next shot.')
on conflict (prompt_id) do nothing;

insert into public.prompt_examples (prompt_id, input, output, position) values
  ('00000000-0000-4000-8000-000000001000', '{"topic":"quitting my job to freelance","audience":"designers","tone":"honest"}', 'I left a $140k job with no clients lined up.

Everyone said I was crazy. Month one, I made $800.

But here''s what nobody tells you about freelancing...

What would make you take the leap?', 0),
  ('00000000-0000-4000-8000-000000001001', '{"subject":"an old fisherman","setting":"a rainy harbor at dusk","mood":"melancholic"}', '[Image] A weathered fisherman under a sodium streetlight, rain streaks catching the rim light.', 0),
  ('00000000-0000-4000-8000-000000001002', '{"language":"Python","code":"def get_user(id): return db.execute(f''SELECT * FROM users WHERE id={id}'')"}', '| Severity | Issue | Fix |
|---|---|---|
| Critical | SQL injection via f-string | Use parameterized query: db.execute(''... WHERE id=?'', (id,)) |', 0),
  ('00000000-0000-4000-8000-000000001003', '{"startup":"a B2B invoicing tool","problem":"late payments for SMBs","stage":"seed"}', 'Slide 1 — Problem
• SMBs wait 47 days on average to get paid
• 60% report cash-flow stress
• Speaker notes: open with a real customer story...', 0),
  ('00000000-0000-4000-8000-000000001004', '{"keyword":"best standing desk","audience":"remote workers","length":"1500"}', 'Meta: Discover the best standing desks for remote workers in 2026...

## Why Your Desk Matters More Than You Think
...', 0),
  ('00000000-0000-4000-8000-000000001005', '{"object":"a rocket","color":"lavender"}', '[Image] A glossy lavender rocket icon, soft shadows, isometric angle.', 0),
  ('00000000-0000-4000-8000-000000001006', '{"framework":"Jest","code":"export const add = (a, b) => a + b"}', 'describe(''add'', () => {
  it(''adds two positive numbers'', () => {...})
})', 0),
  ('00000000-0000-4000-8000-000000001007', '{"product":"an AI scheduling tool","prospect_role":"Head of Sales","pain_point":"no-show demos"}', 'Subject: 23% of your demos are no-shows

Hi Sarah, saw your team doubled this year...', 0),
  ('00000000-0000-4000-8000-000000001008', '{"topic":"photosynthesis","grade":"7"}', 'Objectives:
1. Explain how plants convert light into energy...
Hook: Show a plant in a sealed jar...', 0),
  ('00000000-0000-4000-8000-000000001009', '{"character":"a young sky pirate girl","outfit":"a leather aviator jacket"}', '[Image] Turnaround sheet with three poses and expression row.', 0),
  ('00000000-0000-4000-8000-000000001010', '{"tasks":"taxes, gym, launch landing page, call mom","hours_per_day":"5"}', 'Urgent + Important: taxes, landing page
Monday 9:00–11:00 — Landing page copy...', 0),
  ('00000000-0000-4000-8000-000000001011', '{"product":"wireless earbuds","vibe":"futuristic"}', 'Shot 1 (0–4s): Slow dolly-in on earbuds floating in a dark void, cyan edge light...', 0);

insert into public.purchases (buyer_id, prompt_id, amount_cents, platform_fee_cents, created_at) values
  ('00000000-0000-4000-8000-000000000100', '00000000-0000-4000-8000-000000001000', 499, 100, '2026-09-12'),
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000001000', 499, 100, '2026-08-30'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000001001', 399, 80, '2026-09-01'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000001002', 699, 140, '2026-07-22'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000001003', 999, 200, '2026-06-15')
on conflict (buyer_id, prompt_id) do nothing;

insert into public.reviews (prompt_id, user_id, rating, comment, created_at) values
  ('00000000-0000-4000-8000-000000001000', '00000000-0000-4000-8000-000000000100', 5, 'Got 40k impressions on my first post. Worth 10x the price.', '2026-09-12'),
  ('00000000-0000-4000-8000-000000001000', '00000000-0000-4000-8000-000000000101', 5, 'The hooks are genuinely good. I use it weekly.', '2026-08-30'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000102', 5, 'Consistent results across subjects. Love it.', '2026-09-01'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000103', 5, 'Caught a race condition my team missed.', '2026-07-22'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000104', 5, 'Used it for our seed raise. Saved days.', '2026-06-15')
on conflict (prompt_id, user_id) do nothing;

commit;
