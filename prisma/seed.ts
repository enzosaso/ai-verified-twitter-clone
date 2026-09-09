import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "Demo1234!";

const SEED_USERS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: DEMO_EMAIL,
    username: DEMO_USERNAME,
    displayName: "Demo Bird",
    bio: "Official demo account for The Flock.",
    avatarUrl: "/avatars/demo.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "mara@example.com",
    username: "mara",
    displayName: "Mara Chen",
    bio: "Product designer. Coffee, type, and side projects.",
    avatarUrl: "/avatars/mara.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "julian@example.com",
    username: "julian",
    displayName: "Julian Okoye",
    bio: "Backend engineer. Distributed systems, occasionally.",
    avatarUrl: "/avatars/julian.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    email: "priya@example.com",
    username: "priya",
    displayName: "Priya Raman",
    bio: "ML researcher. Opinions are my own, models even more so.",
    avatarUrl: "/avatars/priya.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    email: "nico@example.com",
    username: "nico",
    displayName: "Nico Alvarez",
    bio: "Photographer wandering with a 35mm and a notebook.",
    avatarUrl: "/avatars/nico.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    email: "aisha@example.com",
    username: "aisha",
    displayName: "Aisha Rahman",
    bio: "Journalist covering cities, transit, and public space.",
    avatarUrl: "/avatars/aisha.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    email: "theo@example.com",
    username: "theo",
    displayName: "Theo Marin",
    bio: "Making records in a spare room. DMs open for collabs.",
    avatarUrl: "/avatars/theo.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    email: "lena@example.com",
    username: "lena",
    displayName: "Lena Voss",
    bio: "Building tools for independent publishers.",
    avatarUrl: "/avatars/lena.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000009",
    email: "owen@example.com",
    username: "owen",
    displayName: "Owen Blake",
    bio: "CS student. Learning in public, one bug at a time.",
    avatarUrl: "/avatars/owen.png",
  },
  {
    id: "00000000-0000-4000-8000-00000000000a",
    email: "suki@example.com",
    username: "suki",
    displayName: "Suki Tanaka",
    bio: "Security engineer. Threat models and sourdough.",
    avatarUrl: "/avatars/suki.png",
  },
  {
    id: "00000000-0000-4000-8000-00000000000b",
    email: "rafa@example.com",
    username: "rafa",
    displayName: "Rafa Mendes",
    bio: "Sports, statistics, and late-night match threads.",
    avatarUrl: "/avatars/rafa.png",
  },
] as const;

export const SEED_USER_IDS = SEED_USERS.map((user) => user.id);

const TWEET_COPY: Record<(typeof SEED_USERS)[number]["username"], string[]> = {
  demo: [
    "Welcome to The Flock. This is the demo account — follow a few people and the timeline will fill in.",
    "Seeding a social graph is strangely satisfying. Users, tweets, follows, likes: the four food groups.",
    "Custom auth is next. Until then, this account exists so the database is not an empty room.",
    "If you can read this, migrations ran and the seed did its job.",
  ],
  mara: [
    "Redesigning a settings page and remembering that every toggle is a product decision.",
    "Type is 90% of the interface. The other 10% is also type, just smaller.",
    "Sketching a denser home feed. The constraint of 280 characters is a gift.",
    "Shipped a spacing scale today. Nobody will notice, which is the point.",
  ],
  julian: [
    "Postgres CHECK constraints are underrated. Let the database refuse the impossible.",
    "If your queue is your source of truth, you do not have a source of truth.",
    "Spent the morning on indexes. The query planner sent a fruit basket.",
    "UUIDs everywhere. Sequences can wait until we miss them.",
    "Cascade deletes are a kindness to the next person on call.",
  ],
  priya: [
    "Evaluation sets rot faster than models. Label with suspicion.",
    "Today's paper: smaller, dumber, cheaper, somehow better on the task we care about.",
    "Feature stores are just databases that went to a conference.",
    "If it is not reproducible, it is a demo.",
  ],
  nico: [
    "Golden hour in the old port. One frame, then I put the camera down.",
    "Street photography rule: if you have to ask, you already missed it.",
    "Editing 400 photos down to 12. The real work is deletion.",
    "Rain on brick is an entire color palette.",
  ],
  aisha: [
    "Transit hearing tonight. Bringing a notebook and a stubborn question about last-mile access.",
    "Cities are made of schedules that almost line up.",
    "A plaza is infrastructure. Treat it like a bridge, not leftover space.",
    "Filed the piece. The interesting quote was in the hallway.",
  ],
  theo: [
    "New loop in 85 BPM. If it still works tomorrow, it goes on the record.",
    "Mixing is just deciding which mistakes get to stay.",
    "Played a Tuesday room of twelve people. Best crowd this month.",
    "Borrowed a Rhodes and forgot to go home.",
  ],
  lena: [
    "Independent publishers do not need another dashboard. They need fewer logins.",
    "Shipping the boring export flow first. Glamour can wait.",
    "Talked to three editors today. All of them mentioned fonts before analytics.",
    "Hiring later. Building the smallest useful thing now.",
    "If your tool requires a webinar, it is not a tool yet.",
  ],
  owen: [
    "Learned what a foreign key actually does. Respectfully terrified.",
    "My first migration applied on the first try. I do not trust it.",
    "Reading other people's seed files like they are novels.",
    "Followed a bunch of people so my future timeline has something to say.",
  ],
  suki: [
    "If the secret is in the repo, it is not a secret. It is a finding.",
    "Threat model for a tweet: impersonation, takeover, and a very public typo.",
    "Argon2id for passwords. The database should never see Demo1234! in plaintext.",
    "Session tokens hashed at rest. Steal the table, keep guessing.",
  ],
  rafa: [
    "Expected goals are a vibe with a spreadsheet.",
    "That finish was 0.03 xG and a poem.",
    "Late kickoff, worse decision-making, better stories.",
    "Unpopular: defensive midfielders should have a higher character limit.",
  ],
};

const FOLLOWS: Array<[(typeof SEED_USERS)[number]["username"], (typeof SEED_USERS)[number]["username"]]> =
  [
    ["demo", "mara"],
    ["demo", "julian"],
    ["demo", "priya"],
    ["demo", "lena"],
    ["demo", "aisha"],
    ["demo", "rafa"],
    ["mara", "demo"],
    ["mara", "priya"],
    ["mara", "nico"],
    ["mara", "lena"],
    ["julian", "demo"],
    ["julian", "priya"],
    ["julian", "suki"],
    ["julian", "theo"],
    ["priya", "mara"],
    ["priya", "julian"],
    ["priya", "aisha"],
    ["nico", "mara"],
    ["nico", "lena"],
    ["nico", "owen"],
    ["aisha", "demo"],
    ["aisha", "priya"],
    ["aisha", "lena"],
    ["aisha", "theo"],
    ["theo", "aisha"],
    ["theo", "lena"],
    ["theo", "nico"],
    ["lena", "demo"],
    ["lena", "mara"],
    ["lena", "aisha"],
    ["lena", "rafa"],
    ["owen", "demo"],
    ["owen", "mara"],
    ["owen", "julian"],
    ["owen", "priya"],
    ["owen", "nico"],
    ["owen", "aisha"],
    ["owen", "theo"],
    ["owen", "lena"],
    ["owen", "suki"],
    ["owen", "rafa"],
    ["suki", "julian"],
    ["suki", "demo"],
    ["suki", "lena"],
    ["rafa", "demo"],
    ["rafa", "lena"],
    ["rafa", "nico"],
    ["rafa", "theo"],
  ];

const LIKES: Array<
  [(typeof SEED_USERS)[number]["username"], (typeof SEED_USERS)[number]["username"], number]
> = [
  ["mara", "demo", 0],
  ["julian", "demo", 0],
  ["lena", "demo", 0],
  ["owen", "demo", 0],
  ["suki", "demo", 3],
  ["priya", "demo", 1],
  ["demo", "mara", 1],
  ["lena", "mara", 1],
  ["owen", "mara", 3],
  ["nico", "mara", 0],
  ["demo", "julian", 0],
  ["suki", "julian", 0],
  ["priya", "julian", 4],
  ["owen", "julian", 2],
  ["mara", "priya", 0],
  ["julian", "priya", 3],
  ["aisha", "priya", 1],
  ["mara", "nico", 0],
  ["theo", "nico", 3],
  ["rafa", "nico", 1],
  ["demo", "aisha", 0],
  ["lena", "aisha", 2],
  ["theo", "aisha", 0],
  ["aisha", "theo", 0],
  ["rafa", "theo", 1],
  ["nico", "theo", 3],
  ["demo", "lena", 0],
  ["mara", "lena", 4],
  ["aisha", "lena", 1],
  ["owen", "lena", 4],
  ["suki", "lena", 0],
  ["rafa", "lena", 2],
  ["mara", "owen", 1],
  ["nico", "owen", 3],
  ["julian", "suki", 0],
  ["demo", "suki", 2],
  ["demo", "rafa", 0],
  ["lena", "rafa", 1],
  ["theo", "rafa", 2],
  ["owen", "rafa", 3],
];

function atMinutes(offset: number): Date {
  return new Date(Date.UTC(2026, 8, 1, 12, 0, 0) + offset * 60_000);
}

function userIdByUsername(username: string): string {
  const user = SEED_USERS.find((entry) => entry.username === username);
  if (!user) {
    throw new Error(`Unknown seed username: ${username}`);
  }
  return user.id;
}

function tweetId(authorId: string, index: number): string {
  const author = SEED_USERS.find((entry) => entry.id === authorId);
  if (!author) {
    throw new Error(`Unknown seed author: ${authorId}`);
  }
  const userIndex = SEED_USERS.indexOf(author) + 1;
  return `00000000-0000-4000-8000-00000001${userIndex.toString(16).padStart(2, "0")}${index.toString(16).padStart(2, "0")}`;
}

export async function seed(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await prisma.$transaction(async (tx) => {
    await tx.like.deleteMany({
      where: {
        OR: [
          { userId: { in: [...SEED_USER_IDS] } },
          { tweet: { authorId: { in: [...SEED_USER_IDS] } } },
        ],
      },
    });
    await tx.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: [...SEED_USER_IDS] } },
          { followingId: { in: [...SEED_USER_IDS] } },
        ],
      },
    });
    await tx.tweet.deleteMany({
      where: { authorId: { in: [...SEED_USER_IDS] } },
    });
    await tx.session.deleteMany({
      where: { userId: { in: [...SEED_USER_IDS] } },
    });

    for (const user of SEED_USERS) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          passwordHash,
        },
        create: {
          ...user,
          passwordHash,
        },
      });
    }

    const tweets = SEED_USERS.flatMap((user, userIndex) =>
      TWEET_COPY[user.username].map((content, tweetIndex) => ({
        id: tweetId(user.id, tweetIndex),
        authorId: user.id,
        content,
        createdAt: atMinutes(userIndex * 40 + tweetIndex * 7),
      })),
    );

    await tx.tweet.createMany({ data: tweets });

    await tx.follow.createMany({
      data: FOLLOWS.map(([follower, following], index) => ({
        followerId: userIdByUsername(follower),
        followingId: userIdByUsername(following),
        createdAt: atMinutes(800 + index),
      })),
    });

    await tx.like.createMany({
      data: LIKES.map(([username, author, tweetIndex], index) => ({
        userId: userIdByUsername(username),
        tweetId: tweetId(userIdByUsername(author), tweetIndex),
        createdAt: atMinutes(900 + index),
      })),
    });
  });
}

async function main() {
  await seed();

  const [users, tweets, follows, likes] = await Promise.all([
    prisma.user.count({ where: { id: { in: [...SEED_USER_IDS] } } }),
    prisma.tweet.count({ where: { authorId: { in: [...SEED_USER_IDS] } } }),
    prisma.follow.count({
      where: { followerId: { in: [...SEED_USER_IDS] } },
    }),
    prisma.like.count({ where: { userId: { in: [...SEED_USER_IDS] } } }),
  ]);

  console.log(
    `Seed complete: ${users} users, ${tweets} tweets, ${follows} follows, ${likes} likes.`,
  );
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("seed.ts");

if (isDirectRun) {
  main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
