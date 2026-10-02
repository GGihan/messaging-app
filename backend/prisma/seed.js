import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

const DUMMY_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

const createUser = async ({ username, plainPassword, bio, avatarUrl }) => {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  return {
    username,
    password: hashedPassword,
    profile: {
      create: {
        displayName: username,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
    },
  };
};

/**
 * Helper to structure Chat data with nested ChatMembers
 */
const createChat = ({
  isGroup = false,
  groupName = null,
  avatarUrl = null,
  memberConfigs = [], // Array of { userId, role, lastReadAt }
}) => ({
  isGroup,
  name: groupName,
  avatarUrl,
  members: {
    create: memberConfigs.map(({ userId, role = "MEMBER", lastReadAt = null }) => ({
      userId,
      role,
      ...(lastReadAt ? { lastReadAt } : {}),
    })),
  },
});

async function main() {
  console.log("Start seeding...");

  // 1. Clean existing records to keep seeding idempotent
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();

  console.log("Cleared existing data.");

  // 2. Prepare 3 Users
  const userPayloads = await Promise.all([
    createUser({
      username: "alice",
      plainPassword: "Password123!",
      bio: "Product designer and open-source enthusiast.",
      avatarUrl: DUMMY_AVATAR,
    }),
    createUser({
      username: "bob",
      plainPassword: "Password123!",
      bio: "Fullstack dev & mechanical keyboard fan.",
    }),
    createUser({
      username: "charlie",
      plainPassword: "Password123!",
      bio: "DevOps & cloud engineering.",
    }),
    createUser({
      username: "david",
      plainPassword: "Password123!",
      bio: "Fullstack dev.",
    }),
    createUser({
      username: "eve",
      plainPassword: "Password123!",
      bio: "",
    }),
  ]);

  // 3. Insert users
  const [alice, bob, charlie, david, eve] = await Promise.all(
    userPayloads.map((data) =>
      prisma.user.create({
        data,
        include: { profile: true },
      })
    )
  );

  console.log(`Created 5 users`);

  // 4. Create Friendships between users
  await prisma.friendship.createMany({
    data: [
      { senderId: alice.id, receiverId: bob.id, status: "ACCEPTED" },
      { senderId: alice.id, receiverId: charlie.id, status: "ACCEPTED" },
      { senderId: bob.id, receiverId: charlie.id, status: "PENDING" },
    ],
  });

  // Reference timestamps for realistic relative chat progression
  const now = Date.now();
  const tMinus = (minutes) => new Date(now - minutes * 60 * 1000);

  // 5. Build Chats
  // In the Alice & Charlie direct chat, Alice's lastReadAt is intentionally set 
  // before Charlie's unread message to demonstrate unread state tracking
  const aliceBobChat = await prisma.chat.create({
    data: createChat({
      isGroup: false,
      memberConfigs: [
        { userId: alice.id, role: "MEMBER" },
        { userId: bob.id, role: "MEMBER" },
      ],
    }),
  });

  const bobCharlieChat = await prisma.chat.create({
    data: createChat({
      isGroup: false,
      memberConfigs: [
        { userId: bob.id, role: "MEMBER" },
        { userId: charlie.id, role: "MEMBER" },
      ],
    }),
  });

  const groupChat = await prisma.chat.create({
    data: createChat({
      isGroup: true,
      groupName: "Engineering Sync",
      avatarUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
      memberConfigs: [
        { userId: alice.id, role: "ADMIN" },
        { userId: bob.id, role: "MEMBER" },
        { userId: charlie.id, role: "MEMBER" },
      ],
    }),
  });

  // 6. Seed messages per chat
  // Note: if your Message model doesn't have an `isRead` column, you can safely remove it
  await prisma.message.createMany({
    data: [
      // ----------------------------------------------------
      // Chat 1: Alice & Bob (Alice sent the last message)
      // ----------------------------------------------------
      {
        chatId: aliceBobChat.id,
        senderId: bob.id,
        text: "Hey Alice, did you push the revised TopAppBar styling?",
        createdAt: tMinus(40),
      },
      {
        chatId: aliceBobChat.id,
        senderId: alice.id,
        text: "Hey! Yes, just resolving the grid column constraint now.",
        createdAt: tMinus(30),
      },
      {
        chatId: aliceBobChat.id,
        senderId: alice.id,
        text: "All merged! Text truncation is running smoothly with ellipsis now.",
        createdAt: tMinus(15),
      },
      {
        chatId: aliceBobChat.id,
        senderId: bob.id,
        text: "Awesome, ping me when it's merged so I can verify on mobile.",
        createdAt: tMinus(2),
      },
      

      // ----------------------------------------------------
      // Chat 2: Bob & Charlie (Charlie sends an unread message)
      // ----------------------------------------------------
      {
        chatId: bobCharlieChat.id,
        senderId: bob.id,
        text: "Hey Charlie, are the Docker images building on staging?",
        createdAt: tMinus(50),
      },
      {
        chatId: bobCharlieChat.id,
        senderId: charlie.id,
        text: "Just updated the runner configuration. Pipeline should finish in 5 mins.",
        createdAt: tMinus(10), // Unread from Charlie to Bob
      },

      // ----------------------------------------------------
      // Chat 3: Engineering Sync Group
      // (Charlie posts an unread update, then Alice sends the final wrap-up)
      // ----------------------------------------------------
      {
        chatId: groupChat.id,
        senderId: bob.id,
        text: "Good morning team! Standup in 10 minutes?",
        createdAt: tMinus(60),
      },
      {
        chatId: groupChat.id,
        senderId: charlie.id,
        text: "Staging deployment was successful! Let me know if you run into any cache bugs.",
        createdAt: tMinus(20),
      },
      {
        chatId: groupChat.id,
        senderId: alice.id,
        text: "Great work everyone! I'll run the smoke tests shortly.",
        createdAt: tMinus(1), // Last message sent by Alice
      },
    ],
  });

  console.log("Created messages for all chats.");
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error during seeding:", error);
    await prisma.$disconnect();
    process.exit(1);
  });