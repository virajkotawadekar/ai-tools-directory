const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function generate() {
    const categories = [
        { id: 1, name: 'Writing', slug: 'writing', icon: 'writing', description: 'AI writing assistants, copy editors, and content generators.' },
        { id: 2, name: 'Coding', slug: 'coding', icon: 'coding', description: 'AI pair programming, UI generators, and auto debugging tools.' },
        { id: 3, name: 'Image', slug: 'image', icon: 'image', description: 'Generative art, photo enhancement, and pixel art synthesis.' },
        { id: 4, name: 'Video', slug: 'video', icon: 'video', description: 'Talking avatar generation, video editing, and text-to-video tools.' },
        { id: 5, name: 'Audio', slug: 'audio', icon: 'audio', description: 'Voice generation, text-to-speech, and music synthesis.' },
        { id: 6, name: 'Marketing', slug: 'marketing', icon: 'marketing', description: 'Conversion optimization, copywriters, and ad visualizers.' },
        { id: 7, name: 'Productivity', slug: 'productivity', icon: 'productivity', description: 'Meeting notes transcribing, workflow enhancement, task automation.' },
        { id: 8, name: 'Business', slug: 'business', icon: 'business', description: 'AI tools for startups, financial forecasting, and CRM integrations.' },
        { id: 9, name: 'Research', slug: 'research', icon: 'research', description: 'Academic research assistants, paper summarizers, and literature review helpers.' },
        { id: 10, name: 'Education', slug: 'education', icon: 'education', description: 'Personalized learning engines, flashcard generators, and smart tutoring systems.' },
        { id: 11, name: 'Design', slug: 'design', icon: 'design', description: 'Logos, vector mockups, color palettes, and UI builders.' },
        { id: 12, name: 'Automation', slug: 'automation', icon: 'automation', description: 'Web scrapers, process automation, and robotic pipeline workflows.' }
    ];

    const baseTools = [
        {
            name: 'ChatGPT',
            slug: 'chatgpt',
            category_id: 1,
            description: 'Advanced language model by OpenAI for writing, brainstorming, programming assistance, and solving complex problems.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            website_url: 'https://chatgpt.com',
            pricing: 'Freemium',
            rating: 4.9,
            monthly_visits: '95M',
            tags: 'chatbot,gpt-4,openai,writing',
            status: 'approved'
        },
        {
            name: 'Claude',
            slug: 'claude',
            category_id: 1,
            description: 'Anthropic\'s high-performance AI model known for detailed comprehension, analysis, creative writing, and coding assistance.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"></path></svg>',
            website_url: 'https://claude.ai',
            pricing: 'Freemium',
            rating: 4.8,
            monthly_visits: '62M',
            tags: 'anthropic,claude-3,reasoning,coding',
            status: 'approved'
        },
        {
            name: 'Gemini',
            slug: 'gemini',
            category_id: 7,
            description: 'Google\'s multimodal AI, deeply integrated into Google Workspace apps to speed up research, drafting, and analysis tasks.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
            website_url: 'https://gemini.google.com',
            pricing: 'Freemium',
            rating: 4.7,
            monthly_visits: '80M',
            tags: 'google,multimodal,productivity,assistant',
            status: 'approved'
        },
        {
            name: 'Midjourney',
            slug: 'midjourney',
            category_id: 3,
            description: 'SOTA image generator converting natural language descriptions into highly-detailed, stunning artistic graphics and concepts.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 6V18M6 12H18"></path></svg>',
            website_url: 'https://midjourney.com',
            pricing: 'Paid',
            rating: 4.8,
            monthly_visits: '45M',
            tags: 'art,image-generation,design,discord',
            status: 'approved'
        },
        {
            name: 'Canva AI',
            slug: 'canva-ai',
            category_id: 11,
            description: 'Text-to-design, magic eraser, and design assistant features integrated into Canva\'s premium publishing ecosystem.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
            website_url: 'https://canva.com',
            pricing: 'Freemium',
            rating: 4.8,
            monthly_visits: '50M',
            tags: 'design,graphics,canva,magic-write',
            status: 'approved'
        },
        {
            name: 'Cursor',
            slug: 'cursor',
            category_id: 2,
            description: 'An AI-first code editor fork of VS Code designed for pairing with intelligent agent scripts to edit, debug, and explain codebases.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
            website_url: 'https://cursor.com',
            pricing: 'Freemium',
            rating: 4.7,
            monthly_visits: '30M',
            tags: 'ide,editor,coding,autocomplete',
            status: 'approved'
        },
        {
            name: 'v0.dev',
            slug: 'v0-dev',
            category_id: 2,
            description: 'Vercel\'s generative UI system that designs production-ready React and HTML layouts from simple descriptive text prompts.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
            website_url: 'https://v0.dev',
            pricing: 'Freemium',
            rating: 4.9,
            monthly_visits: '25M',
            tags: 'ui,react,tailwind,frontend',
            status: 'approved'
        },
        {
            name: 'Runway Gen-3',
            slug: 'runway-gen3',
            category_id: 4,
            description: 'Advanced AI video generation platform generating highly-cinematic video clips with rich physics simulation and motion control.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"></path><path d="M8 21v-4M16 21v-4M12 3v2"></path></svg>',
            website_url: 'https://runwayml.com',
            pricing: 'Paid',
            rating: 4.6,
            monthly_visits: '18M',
            tags: 'video,generative-video,cinematic,runway',
            status: 'approved'
        },
        {
            name: 'ElevenLabs',
            slug: 'elevenlabs',
            category_id: 5,
            description: 'Industry-leading text-to-speech voice generator capable of rendering lifelike voiceovers, audiobooks, and sound effects.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8"></path></svg>',
            website_url: 'https://elevenlabs.io',
            pricing: 'Freemium',
            rating: 4.8,
            monthly_visits: '35M',
            tags: 'voice,speech-synthesis,audio,tts',
            status: 'approved'
        },
        {
            name: 'Jasper AI',
            slug: 'jasper',
            category_id: 6,
            description: 'Enterprise marketing copilot designed to create blog posts, email copy, ads, and brand voice materials 10x faster.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m14 9-4 3 4 3"></path></svg>',
            website_url: 'https://jasper.ai',
            pricing: 'Paid',
            rating: 4.6,
            monthly_visits: '22M',
            tags: 'marketing,copywriting,enterprise,seo',
            status: 'approved'
        },
        {
            name: 'Copilot',
            slug: 'copilot',
            category_id: 2,
            description: 'GitHub Copilot is your AI pair programmer that provides autocomplete style suggestions as you code.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
            website_url: 'https://github.com/features/copilot',
            pricing: 'Paid',
            rating: 4.8,
            monthly_visits: '40M',
            tags: 'github,copilot,autocomplete,coding',
            status: 'approved'
        },
        {
            name: 'Grammarly',
            slug: 'grammarly',
            category_id: 1,
            description: 'AI writing assistant that helps you write clearly and effectively, checking spelling, grammar, and tone.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            website_url: 'https://grammarly.com',
            pricing: 'Freemium',
            rating: 4.7,
            monthly_visits: '70M',
            tags: 'writing,grammar,editing,spelling',
            status: 'approved'
        },
        {
            name: 'Perplexity AI',
            slug: 'perplexity',
            category_id: 9,
            description: 'A conversational search engine that provides accurate answers to complex questions, backed by web citations.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
            website_url: 'https://perplexity.ai',
            pricing: 'Freemium',
            rating: 4.8,
            monthly_visits: '55M',
            tags: 'search,citations,research,llm',
            status: 'approved'
        },
        {
            name: 'Consensus',
            slug: 'consensus',
            category_id: 9,
            description: 'A search engine that uses artificial intelligence to find answers directly in scientific research papers.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
            website_url: 'https://consensus.app',
            pricing: 'Freemium',
            rating: 4.6,
            monthly_visits: '8M',
            tags: 'research,papers,science,academic',
            status: 'approved'
        },
        {
            name: 'Descript',
            slug: 'descript',
            category_id: 5,
            description: 'An all-in-one video and podcast editor that makes editing as simple as writing and editing a text document.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path></svg>',
            website_url: 'https://descript.com',
            pricing: 'Freemium',
            rating: 4.7,
            monthly_visits: '10M',
            tags: 'audio,video,podcast,transcription',
            status: 'approved'
        },
        {
            name: 'Suno AI',
            slug: 'suno',
            category_id: 5,
            description: 'Generative AI music platform that generates complete songs with vocals and instrumentation from text prompts.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
            website_url: 'https://suno.com',
            pricing: 'Freemium',
            rating: 4.8,
            monthly_visits: '25M',
            tags: 'music,audio,vocals,songwriting',
            status: 'approved'
        },
        {
            name: 'Make.com',
            slug: 'make',
            category_id: 12,
            description: 'A visual automation platform that lets you design, build, and automate tasks and workflows in minutes.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 22 22 22"></polygon></svg>',
            website_url: 'https://make.com',
            pricing: 'Freemium',
            rating: 4.7,
            monthly_visits: '14M',
            tags: 'automation,workflow,api,integration',
            status: 'approved'
        },
        {
            name: 'Zapier',
            slug: 'zapier',
            category_id: 12,
            description: 'Automate your work across 5,000+ web applications, building multi-step zaps without writing code.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 22 22 22"></polygon></svg>',
            website_url: 'https://zapier.com',
            pricing: 'Freemium',
            rating: 4.6,
            monthly_visits: '18M',
            tags: 'automation,no-code,zaps,workflows',
            status: 'approved'
        },
        {
            name: 'Duolingo Max',
            slug: 'duolingo-max',
            category_id: 10,
            description: 'AI-powered language learning features including Explain My Answer and Roleplay driven by GPT-4.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
            website_url: 'https://duolingo.com',
            pricing: 'Paid',
            rating: 4.7,
            monthly_visits: '42M',
            tags: 'education,language,learning,gpt-4',
            status: 'approved'
        },
        {
            name: 'Quizlet Plus AI',
            slug: 'quizlet-ai',
            category_id: 10,
            description: 'Smart Study guides, flashcards, and practice tests powered by artificial intelligence to boost exam scores.',
            logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
            website_url: 'https://quizlet.com',
            pricing: 'Freemium',
            rating: 4.5,
            monthly_visits: '30M',
            tags: 'flashcards,exams,study,education',
            status: 'approved'
        }
    ];

    const prefixes = ['Pro', 'Smart', 'Flow', 'Nova', 'Apex', 'Super', 'Nexus', 'Alpha', 'Deep', 'Sync', 'Flex', 'Intel', 'Optima', 'Swift', 'Meta', 'Zen', 'Aero', 'Vibe', 'Quantum', 'Omni'];
    
    const nouns = {
        1: ['Scribe', 'Editor', 'Draft', 'Pen', 'Copy', 'Script', 'Text', 'Ink'],
        2: ['Coder', 'Dev', 'Debug', 'Compile', 'Code', 'Builder', 'Agent', 'Git'],
        3: ['Paint', 'Studio', 'Render', 'Pixel', 'Canvas', 'Art', 'Draw', 'Vance'],
        4: ['Clip', 'Director', 'Cut', 'Motion', 'Film', 'Scene', 'Stream', 'Play'],
        5: ['Voice', 'Speech', 'Sound', 'Audio', 'Tune', 'Beat', 'Echo', 'Wave'],
        6: ['Ad', 'Sales', 'Campaign', 'Lead', 'SEO', 'Brand', 'Pitch', 'Market'],
        7: ['Task', 'Calendar', 'Notes', 'Search', 'Assistant', 'Focus', 'Doc', 'Flow'],
        8: ['Biz', 'Corp', 'Growth', 'Deal', 'Ventures', 'Trade', 'Metrics', 'Analyst'],
        9: ['Scholar', 'Thesis', 'Study', 'Search', 'Cite', 'Query', 'Discover', 'Logic'],
        10: ['Tutor', 'Learn', 'Class', 'Skill', 'Edu', 'Mind', 'Brain', 'Smart'],
        11: ['Design', 'Layout', 'Frame', 'Mock', 'Brand', 'Palette', 'Vector', 'Sketch'],
        12: ['Bot', 'Auto', 'Run', 'Cron', 'Pipeline', 'Trigger', 'Action', 'Sync']
    };

    const templates = {
        1: 'AI assistant designed to accelerate your writing process. Excellent for blogs, emails, and full drafts.',
        2: 'Next-generation assistant for developers. Supports autocompletion, refactoring, and automated testing.',
        3: 'Create beautiful digital artwork and assets. Perfect for social media, concepts, and web illustrations.',
        4: 'AI video generation and editing tool. Easily add talking avatars, subtitles, and cinematic transitions.',
        5: 'Create lifelike voiceovers, audiobooks, podcasts, sound effects, and musical accompaniment.',
        6: 'Optimize your marketing campaigns. Run ad audits, generate conversion copy, and track keyword SEO.',
        7: 'Boost your daily productivity. Capture transcripts, automate summaries, and structure databases.',
        8: 'Build financial forecasts, business pitches, and automate business processes for startups and corporations.',
        9: 'Accelerate academic research. Summarize journals, draft citations, and find answers in scientific papers.',
        10: 'Accelerate student learning. Design study flashcards, generate practice quizzes, and explain complex concepts.',
        11: 'Design UI layouts, logos, brand identities, and vector assets in seconds using advanced semantic layouts.',
        12: 'Automate complex manual workflows, script integrations, scheduled web scraper pipelines, and API triggers.'
    };

    const pricingModels = ['Free', 'Freemium', 'Paid', 'Free Trial'];

    const toolsList = [...baseTools];
    const generatedNeeded = 100 - toolsList.length;

    for (let i = 0; i < generatedNeeded; i++) {
        // Distribute tools across the 12 categories
        const catId = (i % 12) + 1;
        const catObj = categories.find(c => c.id === catId);
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const catNouns = nouns[catId];
        const noun = catNouns[Math.floor(Math.random() * catNouns.length)];
        const suffix = i + 1;
        
        const name = `${prefix}${noun} v${suffix}`;
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const rating = parseFloat((4.0 + Math.random() * 1.0).toFixed(1));
        const visitsVal = Math.floor(Math.random() * 45) + 1;
        const monthly_visits = `${visitsVal}M`;
        const pricing = pricingModels[Math.floor(Math.random() * pricingModels.length)];
        const tags = `${catObj.slug},${prefix.toLowerCase()},${noun.toLowerCase()},ai-tool`;
        const description = `${name} is an advanced AI assistant designed to boost your efficiency. ${templates[catId]} Ideal for modern teams.`;
        
        const logo = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>`;

        toolsList.push({
            name,
            slug,
            category_id: catId,
            description,
            logo,
            website_url: `https://${slug}.example.com`,
            pricing,
            rating,
            monthly_visits,
            tags,
            status: 'approved'
        });
    }

    // Add some pending tools for testing approvals
    toolsList.push({
        name: 'Drafto AI',
        slug: 'drafto-ai',
        category_id: 1,
        description: 'A pending submissions AI tool designed to create rapid blog draft outlines.',
        logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>',
        website_url: 'https://drafto.example.com',
        pricing: 'Free',
        rating: 4.0,
        monthly_visits: '0K',
        tags: 'writing,draft,pending',
        status: 'pending'
    });

    toolsList.push({
        name: 'AutoDeployer',
        slug: 'autodeployer',
        category_id: 12,
        description: 'An intelligent automation agent that monitors Git commits and deploys them directly to VPS hosts.',
        logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline></svg>',
        website_url: 'https://autodeployer.example.com',
        pricing: 'Free Trial',
        rating: 4.2,
        monthly_visits: '0K',
        tags: 'automation,deploy,pending',
        status: 'pending'
    });

    // Hash passwords using bcrypt (10 rounds)
    const hashedAdminPassword = await bcrypt.hash('adminpassword', 10);
    const hashedUserPassword = await bcrypt.hash('userpassword', 10);

    let sql = `USE ai_directory;\n\n`;
    sql += `DELETE FROM reviews;\n`;
    sql += `DELETE FROM tools;\n`;
    sql += `DELETE FROM users;\n`;
    sql += `DELETE FROM categories;\n\n`;

    sql += `-- INSERT CATEGORIES\n`;
    categories.forEach(c => {
        sql += `INSERT INTO categories (id, name, slug, icon, description) VALUES (${c.id}, '${c.name.replace(/'/g, "''")}', '${c.slug}', '${c.icon}', '${c.description.replace(/'/g, "''")}');\n`;
    });
    sql += `\n`;

    sql += `-- INSERT USERS\n`;
    sql += `INSERT INTO users (id, name, email, password, role) VALUES (1, 'AI Directory Admin', 'admin@aidirectory.com', '${hashedAdminPassword}', 'admin');\n`;
    sql += `INSERT INTO users (id, name, email, password, role) VALUES (2, 'Sample User', 'user@aidirectory.com', '${hashedUserPassword}', 'user');\n\n`;

    sql += `-- INSERT AI TOOLS\n`;
    toolsList.forEach((t, index) => {
        sql += `INSERT INTO tools (id, name, slug, category_id, description, logo, website_url, pricing, rating, monthly_visits, tags, status) VALUES (${index + 1}, '${t.name.replace(/'/g, "''")}', '${t.slug}', ${t.category_id}, '${t.description.replace(/'/g, "''")}', '${t.logo.replace(/'/g, "''")}', '${t.website_url}', '${t.pricing}', ${t.rating}, '${t.monthly_visits}', '${t.tags.replace(/'/g, "''")}', '${t.status}');\n`;
    });
    sql += `\n`;

    // Add some initial reviews for base tools to test review aggregation
    sql += `-- INSERT REVIEWS\n`;
    sql += `INSERT INTO reviews (user_id, tool_id, rating, comment) VALUES (2, 1, 5, 'Absolutely incredible tool! Use it every day for brainstorming and quick drafting.');\n`;
    sql += `INSERT INTO reviews (user_id, tool_id, rating, comment) VALUES (2, 2, 4, 'Very good at understanding long context. Writing is very natural.');\n`;
    sql += `INSERT INTO reviews (user_id, tool_id, rating, comment) VALUES (2, 4, 5, 'The image quality is mind-blowing. Midjourney is still the king of art generation.');\n`;
    sql += `INSERT INTO reviews (user_id, tool_id, rating, comment) VALUES (2, 6, 5, 'Highly recommend Cursor. The pairing agents write correct code instantly.');\n`;

    const destDir = path.join(__dirname, '../database');
    if (!fs.existsSync(destDir)){
        fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, 'seed.sql');
    fs.writeFileSync(destPath, sql, 'utf8');
    console.log(`Generated seed.sql successfully in database/ directory! Tools generated: ${toolsList.length}`);
}

generate().catch(err => {
    console.error('Error generating seed SQL:', err);
    process.exit(1);
});
