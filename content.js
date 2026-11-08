// All personal content for the site lives here.
// Edit this file to update projects, experience or links — no layout code needed.

export default {
  name: 'Shiraaz Haidar',
  initials: [
    { rank: 'S', suit: '♠' },
    { rank: 'H', suit: '♥' },
  ],
  tagline: 'CS + Applied Math @ University of Michigan',
  pitch: 'I build simulations and systems that make decisions under uncertainty.',
  education: 'B.S. Computer Science · B.S. Applied Mathematics · Expected May 2030',

  stats: [
    { value: '10,466 ft', label: 'flight my filter flew on' },
    { value: '8', label: 'AWS Lambda APIs shipped' },
    { value: '400+ hrs', label: 'math tutoring delivered' },
  ],

  links: {
    email: 'shiraazh@umich.edu',
    github: 'https://github.com/ShiraazHaidar',
    linkedin: 'https://www.linkedin.com/in/shiraazhaidar/',
    resume: 'assets/resume.pdf',
  },

  // The Flop — three headline projects. `card` is the playing-card index shown in the corners.
  flop: [
    {
      card: { rank: 'A', suit: '♠' },
      title: 'Solar Car Race Simulator',
      role: 'Strategy Member · University of Michigan Solar Car Team',
      dates: 'Sept 2026 – Present',
      problem: 'How fast can the car drive all race day without running the battery flat?',
      built: [
        'Built a C++ race simulator modeling aerodynamic drag, rolling resistance, solar generation and battery charge.',
        'Applied binary search over cruise speed to find the maximum sustainable speed under battery constraints.',
        'Developing stochastic weather simulations to evaluate race strategies under uncertainty.',
      ],
      stack: ['C++', 'Numerical simulation', 'Binary search', 'Stochastic simulation'],
      result: 'Finds the fastest speed the battery can sustain — then stress-tests it against random weather.',
    },
    {
      card: { rank: 'K', suit: '♥' },
      title: 'Rocket Flight Software',
      role: 'Flight Software · Michigan Rocketry (MASA – Dearborn)',
      dates: 'Aug 2025 – Apr 2026',
      problem: 'Raw sensor readings are noisy; the flight computer needs a trustworthy estimate of the rocket’s state.',
      built: [
        'Implemented predictive sensor filtering in C++, combining motion predictions with sensor measurements to estimate flight state.',
        'Compared raw and filtered measurements to evaluate noise reduction and stability.',
      ],
      stack: ['C++', 'State estimation', 'Sensor filtering'],
      result: 'Ran onboard during the team’s 10,466-ft rocket flight.',
    },
    {
      card: { rank: 'Q', suit: '♦' },
      title: 'AWSFinance',
      role: 'Full-Stack Web App · AWS Student Builder Group',
      dates: 'Sept 2026 – Present',
      problem: 'The student group needed one place to manage its grants and events.',
      built: [
        'Built and deployed 8 Python Lambda APIs (create, list, update, delete for grants and events) behind API Gateway, backed by DynamoDB.',
        'Defined the cloud infrastructure as code with AWS CDK.',
        'Integrated a React + TypeScript frontend with authentication to support student-organization finance workflows.',
      ],
      stack: ['Python', 'AWS Lambda', 'API Gateway', 'DynamoDB', 'AWS CDK', 'React', 'TypeScript'],
      result: 'Deployed serverless backend for the group’s grant and event management.',
      link: 'https://github.com/ShiraazHaidar/AWSFinance',
    },
  ],

  // The Turn — side action.
  turn: [
    {
      card: { rank: 'J', suit: '♣' },
      title: 'Multiplayer Escape Game',
      role: 'Co-Developer & 3D Designer · Roblox',
      dates: 'July 2026 – Present',
      problem: 'A cooperative puzzle game where players’ items and progress must stay in sync.',
      built: [
        'Developing inventory, persistence and player-interaction systems.',
        'Fixed multiplayer synchronization bugs caused by heartbeat timing inconsistencies.',
        'Created 30+ original 3D assets and completed the maps for the first world.',
      ],
      stack: ['Luau', 'Roblox Studio', '3D modeling'],
      result: 'First world complete, with 30+ original assets.',
    },
    {
      card: { rank: '10', suit: '♦' },
      title: 'DIY Racing Wheelbase & Pedals',
      role: 'Embedded Hardware Project',
      dates: 'Apr 2026 – Present',
      problem: 'A direct-drive sim-racing rig built from motor controllers up.',
      built: [
        'Assembled and verified Hall-effect accelerator and load-cell brake pedals in Windows Game Controller and driving tests.',
        'Building a direct-drive wheelbase with STM32F405-based ODESC motor controllers and MT6701 encoders; mechanical assembly and force-feedback validation in progress.',
      ],
      stack: ['STM32', 'ODESC', 'MT6701 encoders', 'Load cells'],
      result: 'Pedals verified; wheelbase force feedback in progress.',
    },
  ],

  // The River — experience, honors and skills.
  experience: [
    {
      title: 'Vice President & Founding Member',
      org: 'AWS Student Builder Group',
      dates: 'July 2026 – Present',
      points: [
        'Manage a $5,000+ annual budget, maintain financial records and plan spending for student programs.',
        'Coordinate with AWS employees on technical workshops and industry engagement at MHacks.',
      ],
    },
    {
      title: 'Student Corps Intern',
      org: 'General Motors',
      dates: 'June 2025 – Aug 2025',
      points: [
        'Planned budgets and logistics for infrastructure improvements and school-supply projects in Southeast Michigan.',
        'Collaborated with GM retirees, company leaders and fellow interns to carry out community projects.',
      ],
    },
    {
      title: 'Mathematics Tutor',
      org: 'Woodhaven High School',
      dates: 'Sept 2024 – June 2026',
      points: [
        'Delivered 400+ hours of tutoring, Algebra 1 through Calculus II and SAT Math.',
        'Helped three students improve their SAT scores by an average of 90 points.',
      ],
    },
    {
      title: 'Co-Founder & Lead',
      org: 'Humanitarian Outreach Project for Everyone (HOPE)',
      dates: 'Feb 2025 – Aug 2026',
      points: [
        'Managed nonprofit filing and coordinated volunteers with local charity partners.',
        'Organized the distribution of 5,000+ meals across three Michigan counties.',
      ],
    },
  ],

  honors: [
    'Michigan 1st Place, Gold Tier — CyberPatriots',
    'QuestBridge Finalist',
    'Summa Cum Laude',
  ],

  skills: [
    { group: 'Languages', items: ['C++', 'Python', 'TypeScript', 'Luau'] },
    { group: 'Methods', items: ['Numerical simulation', 'State estimation', 'Sensor filtering'] },
    { group: 'Tools', items: ['Git', 'CMake', 'React', 'AWS Lambda', 'API Gateway', 'DynamoDB'] },
  ],
};
