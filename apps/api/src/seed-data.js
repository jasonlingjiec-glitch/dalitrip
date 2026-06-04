export const seedData = {
  groups: [
    { id: "group-hiking", name: "徒步组" },
    { id: "group-craft", name: "手作组" },
    { id: "group-water", name: "水上运动组" }
  ],
  adminAccounts: [
    { id: "account-owner", role: "OWNER", displayName: "主账号", mobile: "13636360694", enabled: true, groupIds: ["group-hiking", "group-craft", "group-water"] },
    { id: "account-guide-demo", role: "SUBACCOUNT", displayName: "小白", mobile: "13800001111", enabled: true, groupIds: ["group-hiking"] }
  ],
  tags: [
    { id: "tag-hiking", code: "hiking", translations: { "zh-CN": "徒步", en: "Hiking" } },
    { id: "tag-beginner", code: "beginner", translations: { "zh-CN": "适合新手", en: "Beginner friendly" } },
    { id: "tag-family", code: "family", translations: { "zh-CN": "亲子", en: "Family friendly" } },
    { id: "tag-water", code: "water", translations: { "zh-CN": "水上活动", en: "Water activity" } },
    { id: "tag-craft", code: "craft", translations: { "zh-CN": "手作", en: "Craft" } },
    { id: "tag-nature", code: "nature", translations: { "zh-CN": "自然观察", en: "Nature observation" } },
    { id: "tag-half-day", code: "half-day", translations: { "zh-CN": "半日体验", en: "Half-day" } },
    { id: "tag-dog", code: "dog-friendly", translations: { "zh-CN": "领队有小狗", en: "Guide with a dog" } }
  ],
  guides: [
    {
      id: "guide-xiaobai",
      name: "小白",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85",
      descriptionHtml: "<p>长期带领苍山轻徒步与自然观察活动，熟悉溪流、森林和季节植物。喜欢让第一次走进山林的人也能放松下来。</p>"
    }
  ],
  guidePage: {
    introductionHtml: "<h2>和熟悉山野的人一起出发</h2><p>每一位领队都有自己喜欢的路线、季节与观察方式。先认识他们，再选择一段适合自己的旅程。</p>"
  },
  topicPages: [
    {
      id: "topic-light-hiking",
      slug: "light-hiking",
      title: "轻徒步专题",
      summary: "第一次走进山林，也可以从舒服、从容的路线开始。",
      imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
      externalUrl: "",
      tagIds: ["tag-hiking", "tag-beginner"],
      introductionHtml: "<h2>把脚步放慢一点</h2><p>适合初次尝试山野活动，也适合想在森林里认真呼吸一会儿的人。这里收录了带有“徒步”和“适合新手”标签的活动。</p>",
      published: true
    }
  ],
  blogPosts: [
    {
      id: "blog-weeds-handpoke",
      slug: "weeds-handpoke",
      title: "杂草景 | handpoke",
      coverUrl: "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?auto=format&fit=crop&w=900&q=85",
      summary: "知音离开的时候说：“你可以自己扎自己，没准还因此学会一个新技能。”",
      contentHtml: "<p>知音离开的时候说：“你可以自己扎自己，没准还因此学会一个新技能。”然后，我真的扎了自己。</p><p>大理的生活有时候像一块慢慢展开的布，日常里有山、风、朋友，也有一些临时冒出来的小念头。我们把这些片段写下来，不一定都是攻略，但它们常常解释了为什么我们会在这里做活动。</p>",
      publishedAt: "2026-05-27T10:00:00+08:00",
      published: true
    },
    {
      id: "blog-summer-ending",
      slug: "summer-ending",
      title: "旺旺 | 夏日终曲",
      coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
      summary: "",
      contentHtml: "<p>饭后，聊到刚刚接受这份工作时，杨米和我都没有开心的情绪，只有点点的慌张，真有趣。</p><p>后来我们发现这工作多好，好在哪里，需要说很久。一开始的慌张变得很珍贵，它提醒我们：新的生活总是从不确定开始。</p>",
      publishedAt: "2026-05-27T11:30:00+08:00",
      published: true
    },
    {
      id: "blog-jason-time",
      slug: "jason-time",
      title: "杰森 | “岁月不再来”",
      coverUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
      summary: "",
      contentHtml: "<p>刚看完文章，那个时候你真漂亮。每次看 Jason 的文字都有淡淡的忧伤。</p><p>他或许是在记录，我每看一篇，岁月不再来的感觉也会浮出来。旅行和生活有时候并不是为了抵达，而是为了认真看见这些瞬间。</p>",
      publishedAt: "2026-05-27T14:20:00+08:00",
      published: true
    },
    {
      id: "blog-five-activities",
      slug: "five-activities",
      title: "一个点 | 五个活动·六样领队",
      coverUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85",
      summary: "五天的苍山徒步之家之旅，让他在最短的时间内接触到了六种不同的人。",
      contentHtml: "<p>五天的苍山徒步之家之旅，让他在最短的时间内接触到了六种不同的人。我们有认真阅读向导简历，也会在活动里慢慢感受每位领队的节奏。</p><p>同一个地点，可以发生很多种活动。有人喜欢植物，有人喜欢路线，有人喜欢讲故事，有人只是带你安静地走过一段路。</p>",
      publishedAt: "2026-03-13T09:00:00+08:00",
      published: true
    }
  ],
  blogComments: [
    {
      id: "blog-comment-1",
      postId: "blog-weeds-handpoke",
      customerId: "customer-demo",
      displayName: "Mia",
      content: "很喜欢这种有一点日常切面的记录，看完会更想知道你们平时怎么生活。",
      createdAt: "2026-05-28T11:20:00+08:00",
      hidden: false
    }
  ],
  homeEntries: [
    {
      id: "home-entry-hiking",
      title: "轻徒步专题",
      subtitle: "TRAVEL",
      imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=85",
      targetType: "TOPIC",
      targetValue: "light-hiking",
      sortOrder: 1,
      published: true
    },
    {
      id: "home-entry-guides",
      title: "认识领队",
      subtitle: "GUIDES",
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=85",
      targetType: "GUIDES",
      targetValue: "",
      sortOrder: 2,
      published: true
    }
  ],
  homeModules: [
    { id: "home-module-cube", type: "CUBE", title: "精选入口", sortOrder: 1, published: true, limit: 4, tagIds: [] },
    {
      id: "home-module-nav",
      type: "NAV",
      title: "首页导航",
      sortOrder: 2,
      published: true,
      limit: 4,
      tagIds: [],
      navItems: [
        { title: "攻略", subtitle: "TRAVEL", targetType: "TOPIC", targetValue: "light-hiking" },
        { title: "向导", subtitle: "GUIDES", targetType: "GUIDES", targetValue: "" },
        { title: "专题", subtitle: "COLLECTIONS", targetType: "TOPIC", targetValue: "light-hiking" }
      ],
      style: { layout: "FOUR" }
    },
    { id: "home-module-upcoming", type: "UPCOMING", title: "即将出发的旅行", sortOrder: 3, published: true, limit: 20, tagIds: [] },
    { id: "home-module-topics", type: "TOPICS", title: "专题探索", sortOrder: 4, published: true, limit: 4, tagIds: [] },
    { id: "home-module-reviews", type: "REVIEWS", title: "最近的体验", sortOrder: 5, published: true, limit: 5, tagIds: [] },
    { id: "home-module-activities", type: "ACTIVITIES", title: "活动推荐", sortOrder: 6, published: true, limit: 6, tagIds: [] }
  ],
  activities: [
    {
      id: "activity-forest-hike",
      groupId: "group-hiking",
      advanceBookingHours: 12,
      schedulePaused: false,
      meetingLatitude: 25.689326,
      meetingLongitude: 100.166334,
      leaderWechat: "dalitrip-guide",
      guideIds: ["guide-xiaobai"],
      coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": {
          name: "徒步蕨类森林",
          summary: "沿溪流进入森林，适合第一次参加轻徒步的客人。",
          meetingPointName: "根据路线提前通知",
          suitableAge: "8 岁以上"
        },
        en: {
          name: "Fern Forest Hike",
          summary: "A gentle stream-side forest walk for first-time hikers.",
          meetingPointName: "Shared before departure",
          suitableAge: "Age 8+"
        }
      },
      tagIds: ["tag-hiking", "tag-beginner"],
      images: [
        { id: "image-forest-1", cosKey: "demo/forest-hike-cover.jpg", sortOrder: 1 },
        { id: "image-forest-2", cosKey: "demo/forest-ferns-1.jpg", sortOrder: 2 },
        { id: "image-forest-3", cosKey: "demo/forest-ferns-2.jpg", sortOrder: 3 },
        { id: "image-forest-4", cosKey: "demo/forest-stream.jpg", sortOrder: 4 },
        { id: "image-forest-5", cosKey: "demo/forest-moss.jpg", sortOrder: 5 }
      ]
    },
    {
      id: "activity-lake-kayak",
      groupId: "group-water",
      advanceBookingHours: 4,
      schedulePaused: false,
      meetingLatitude: 25.743268,
      meetingLongitude: 100.176771,
      leaderWechat: "dalitrip-water",
      guideIds: [],
      coverUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "洱海晨光皮划艇", summary: "在安静的湖面上慢慢划行，适合第一次体验水上活动。", meetingPointName: "才村码头附近", suitableAge: "10 岁以上" },
        en: { name: "Erhai Sunrise Kayaking", summary: "A relaxed first kayaking experience on the lake.", meetingPointName: "Near Caicun Pier", suitableAge: "Age 10+" }
      },
      tagIds: ["tag-water", "tag-beginner", "tag-half-day"],
      images: [{ id: "image-kayak-1", cosKey: "demo/lake-kayak.jpg", sortOrder: 1 }]
    },
    {
      id: "activity-pottery-painting",
      groupId: "group-craft",
      advanceBookingHours: 2,
      schedulePaused: false,
      meetingLatitude: 25.606348,
      meetingLongitude: 100.267638,
      leaderWechat: "dalitrip-craft",
      guideIds: [],
      coverUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "景山陶艺与植物绘画", summary: "亲手完成一件有大理植物气息的小作品。", meetingPointName: "景山陶艺工作室", suitableAge: "4 岁以上" },
        en: { name: "Pottery and Botanical Painting", summary: "Create a small botanical-inspired pottery piece.", meetingPointName: "Jingshan Pottery Studio", suitableAge: "Age 4+" }
      },
      tagIds: ["tag-craft", "tag-family", "tag-half-day"],
      images: [{ id: "image-pottery-1", cosKey: "demo/pottery.jpg", sortOrder: 1 }]
    },
    {
      id: "activity-tie-dye",
      groupId: "group-craft",
      advanceBookingHours: 2,
      schedulePaused: false,
      meetingLatitude: 25.813579,
      meetingLongitude: 100.121285,
      leaderWechat: "dalitrip-craft",
      guideIds: [],
      coverUrl: "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "周城白族扎染体验", summary: "认识传统纹样，从绑扎到晾晒完成自己的扎染布。", meetingPointName: "周城村口", suitableAge: "6 岁以上" },
        en: { name: "Zhoucheng Tie-Dye Workshop", summary: "Learn traditional patterns and make your own tie-dye fabric.", meetingPointName: "Zhoucheng Village Entrance", suitableAge: "Age 6+" }
      },
      tagIds: ["tag-craft", "tag-family"],
      images: [{ id: "image-dye-1", cosKey: "demo/tie-dye.jpg", sortOrder: 1 }]
    },
    {
      id: "activity-wild-tea",
      groupId: "group-hiking",
      advanceBookingHours: 8,
      schedulePaused: false,
      meetingLatitude: 25.691951,
      meetingLongitude: 100.16451,
      leaderWechat: "dalitrip-guide",
      guideIds: ["guide-xiaobai"],
      coverUrl: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "苍山森林采野茶", summary: "边走边认识山林植物，采一小把茶叶带回家。", meetingPointName: "苍山脚下集合", suitableAge: "8 岁以上" },
        en: { name: "Cangshan Wild Tea Walk", summary: "Walk through the forest and learn about mountain plants.", meetingPointName: "Cangshan foothill meeting point", suitableAge: "Age 8+" }
      },
      tagIds: ["tag-hiking", "tag-nature", "tag-dog"],
      images: [{ id: "image-tea-1", cosKey: "demo/wild-tea.jpg", sortOrder: 1 }]
    },
    {
      id: "activity-mushroom-observation",
      groupId: "group-hiking",
      advanceBookingHours: 6,
      schedulePaused: false,
      meetingLatitude: 25.695311,
      meetingLongitude: 100.15947,
      leaderWechat: "dalitrip-guide",
      guideIds: ["guide-xiaobai"],
      coverUrl: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "Mini 苍山蘑菇与昆虫观察", summary: "带孩子在森林里认真观察小小的生命。", meetingPointName: "苍山感通索道附近", suitableAge: "5 岁以上" },
        en: { name: "Mini Mushroom and Insect Observation", summary: "A gentle forest observation walk for curious families.", meetingPointName: "Near Gantong Cableway", suitableAge: "Age 5+" }
      },
      tagIds: ["tag-hiking", "tag-family", "tag-nature", "tag-half-day"],
      images: [{ id: "image-mushroom-1", cosKey: "demo/mushroom.jpg", sortOrder: 1 }]
    },
    {
      id: "activity-lake-sup",
      groupId: "group-water",
      advanceBookingHours: 4,
      schedulePaused: false,
      meetingLatitude: 25.742064,
      meetingLongitude: 100.178743,
      leaderWechat: "dalitrip-water",
      guideIds: [],
      coverUrl: "https://images.unsplash.com/photo-1526188717906-ab4a2f70b5d3?auto=format&fit=crop&w=700&q=85",
      translations: {
        "zh-CN": { name: "洱海桨板入门", summary: "从岸边练习开始，慢慢站上桨板看湖面风景。", meetingPointName: "才村水上基地", suitableAge: "12 岁以上" },
        en: { name: "Erhai SUP Introduction", summary: "A calm stand-up paddleboarding introduction by the lake.", meetingPointName: "Caicun Water Base", suitableAge: "Age 12+" }
      },
      tagIds: ["tag-water", "tag-beginner", "tag-half-day"],
      images: [{ id: "image-sup-1", cosKey: "demo/sup.jpg", sortOrder: 1 }]
    }
  ],
  scheduleRules: [
    {
      id: "rule-forest-weekend",
      activityId: "activity-forest-hike",
      ruleType: "REGULAR",
      weekday: 6,
      startsAt: "14:00",
      endsAt: "18:00",
      capacity: 12,
      priceOptions: [
        { id: "price-rule-adult", name: "成人", priceCents: 26800 },
        { id: "price-rule-child", name: "儿童", priceCents: 16800 }
      ],
      enabled: true
    }
  ],
  slots: [
    {
      id: "slot-forest-demo",
      activityId: "activity-forest-hike",
      startsAt: "2026-06-06T14:00:00+08:00",
      endsAt: "2026-06-06T18:00:00+08:00",
      capacity: 12,
      bookedCount: 3,
      priceOptions: [
        { id: "price-slot-adult", name: "成人", priceCents: 26800 },
        { id: "price-slot-child", name: "儿童", priceCents: 16800 }
      ],
      enabled: true
    },
    {
      id: "slot-kayak-demo",
      activityId: "activity-lake-kayak",
      startsAt: "2026-06-03T09:30:00+08:00",
      endsAt: "2026-06-03T12:00:00+08:00",
      capacity: 8,
      bookedCount: 2,
      priceOptions: [{ id: "price-kayak-adult", name: "成人", priceCents: 39800 }, { id: "price-kayak-child", name: "儿童", priceCents: 26800 }],
      enabled: true
    },
    {
      id: "slot-pottery-demo",
      activityId: "activity-pottery-painting",
      startsAt: "2026-06-04T14:00:00+08:00",
      endsAt: "2026-06-04T16:30:00+08:00",
      capacity: 10,
      bookedCount: 4,
      priceOptions: [{ id: "price-pottery-adult", name: "成人", priceCents: 34800 }, { id: "price-pottery-child", name: "儿童", priceCents: 22800 }],
      enabled: true
    },
    {
      id: "slot-dye-demo",
      activityId: "activity-tie-dye",
      startsAt: "2026-06-05T10:00:00+08:00",
      endsAt: "2026-06-05T12:30:00+08:00",
      capacity: 12,
      bookedCount: 1,
      priceOptions: [{ id: "price-dye-adult", name: "成人", priceCents: 22800 }, { id: "price-dye-child", name: "儿童", priceCents: 16800 }],
      enabled: true
    },
    {
      id: "slot-tea-demo",
      activityId: "activity-wild-tea",
      startsAt: "2026-06-06T09:00:00+08:00",
      endsAt: "2026-06-06T12:30:00+08:00",
      capacity: 9,
      bookedCount: 2,
      priceOptions: [{ id: "price-tea-adult", name: "成人", priceCents: 29800 }, { id: "price-tea-child", name: "儿童", priceCents: 19800 }],
      enabled: true
    },
    {
      id: "slot-mushroom-demo",
      activityId: "activity-mushroom-observation",
      startsAt: "2026-06-06T14:30:00+08:00",
      endsAt: "2026-06-06T17:30:00+08:00",
      capacity: 10,
      bookedCount: 5,
      priceOptions: [{ id: "price-mushroom-adult", name: "成人", priceCents: 26800 }, { id: "price-mushroom-child", name: "儿童", priceCents: 19800 }],
      enabled: true
    },
    {
      id: "slot-sup-demo",
      activityId: "activity-lake-sup",
      startsAt: "2026-06-06T15:00:00+08:00",
      endsAt: "2026-06-06T17:00:00+08:00",
      capacity: 6,
      bookedCount: 1,
      priceOptions: [{ id: "price-sup-adult", name: "成人", priceCents: 36800 }],
      enabled: true
    }
  ],
  customers: [
    {
      id: "customer-demo",
      nickname: "Mia",
      mobile: "13800000000",
      frozen: false,
      walletBalanceCents: 0
    },
    {
      id: "customer-frozen",
      nickname: "Frozen Customer",
      mobile: "13900000000",
      frozen: true,
      walletBalanceCents: 0
    }
  ],
  walletTransactions: [],
  notifications: [],
  reviews: [
    {
      id: "review-demo",
      activityId: "activity-forest-hike",
      customerId: "customer-demo",
      displayName: "Mia",
      rating: 5,
      content: "溪流边的森林很舒服，第一次轻徒步也完全没有压力。",
      imageUrls: [],
      replies: [
        {
          id: "reply-demo",
          authorRole: "LEADER",
          displayName: "领队回复",
          content: "谢谢你的分享，期待下次一起去看不同季节的森林。",
          createdAt: "2026-05-30T13:00:00.000Z"
        }
      ],
      hidden: false,
      createdAt: "2026-05-30T12:00:00.000Z"
    }
  ],
  orders: [
    {
      id: "order-demo-booked",
      orderNo: "DT202606011400DEMO01",
      customerId: "customer-demo",
      groupId: "group-hiking",
      activityId: "activity-forest-hike",
      slotId: "slot-forest-demo",
      quantity: 3,
      priceOptionId: "price-slot-adult",
      specification: "成人",
      unitPriceCents: 26800,
      amountCents: 80400,
      status: "BOOKED",
      paymentMethod: "WECHAT",
      wechatTransactionId: "demo-wechat-transaction",
      profile: { hasChildren: "否" },
      createdAt: "2026-05-30T08:00:00.000Z",
      paidAt: "2026-05-30T08:01:00.000Z",
      capacityLockExpiresAt: null
    }
  ]
};
