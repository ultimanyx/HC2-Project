document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "novels";
  const tbody = document.getElementById("all-novels-tbody");
  if (!tbody) return;

  const searchInput = document.getElementById("search-novel");
  const statusFilter = document.getElementById("status-filter");
  const sortSelect = document.getElementById("sort-novel");
  const applyBtn = document.getElementById("apply-btn");
  const resetBtn = document.getElementById("reset-btn");

  const getNovels = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };

  const saveNovels = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  // ==========================================
  // SEED ALL HOMEPAGE BOOKS
  // ==========================================
  function seedHomepageBooks() {
    let novels = getNovels();
    let changed = false;

    // CLEANUP: Remove old seeds
    const initialLength = novels.length;
    novels = novels.filter(
      (n) =>
        String(n.id) !== "seed-0" &&
        String(n.id) !== "seed-1" &&
        String(n.id) !== "demo-novel",
    );
    if (novels.length !== initialLength) changed = true;

    const LOREM =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    // COMPLETE REAL CHAPTER TITLES EXTRACTED FROM YOUR HTML
    const chapterDB = {
      "a-tale-of-two-cities": [
        "Chapter 1: The Period",
        "Chapter 2: The Mail",
        "Chapter 3: The Night Shadows",
        "Chapter 4: The Preparation",
        "Chapter 5: The Wine-Shop",
        "Chapter 6: The Shoe Maker",
        "Chapter 7: Five Years Later",
        "Chapter 8: A Sight",
        "Chapter 9: A Dissapoinment",
        "Chapter 10: Congratulatory",
        "Chapter 11: The Jackal",
        "Chapter 12: Hundreds of People",
        "Chapter 13: The New Beningging",
        "Chapter 14: Monseigneur in Town",
        "Chapter 15: Monseigneur in the Country",
        "Chapter 16: The Gorgon's Head",
        "Chapter 17: Two Promises",
        "Chapter 18: A Companion Picture",
        "Chapter 19: The Fellow of Delicacy",
        "Chapter 20: The Fellow of No Delicacy",
        "Chapter 21: The Honest Tradesman",
        "Chapter 22: Knitting",
        "Chapter 23: Still Knitting",
        "Chapter 24: One Night",
        "Chapter 25: Nine Days",
        "Chapter 26: An Opinion",
        "Chapter 27: A Plea",
        "Chapter 28: Echoing Footsteps",
        "Chapter 29: The Sea Still Rises",
        "Chapter 30: Fire Rises",
        "Chapter 31: Drawn to the Loadstone Rock",
        "Chapter 32: Hundreds of People",
        "Chapter 33: In Secret",
        "Chapter 34: The Grindstone",
        "Chapter 35: The Shadow",
        "Chapter 36: Calm in Storm",
        "Chapter 37: The Wood-Sawyer",
        "Chapter 38: Triumph",
        "Chapter 39: A Knock at the Door",
        "Chapter 40: A Hand at Cards",
        "Chapter 41: The Game Made",
        "Chapter 42: The Substance of the Shadow",
        "Chapter 43: Dusk",
        "Chapter 44: Darkness",
        "Chapter 45: Fifty-two",
        "Chapter 46: The Knitting Done",
        "Chapter 47: The Footsteps Die Out For Ever",
      ],
      dracula: [
        "Chapter 1: Jonathan Harker's Journal",
        "Chapter 2: Jonathan Harker's Journal (Continued)",
        "Chapter 3: Jonathan Harker's Journal (Continued)",
        "Chapter 4: Jonathan Harker's Journal (Continued)",
        "Chapter 5: Letter from Miss Mina Murray to Miss Lucy Westenra",
        "Chapter 6: Mina Murray's Journal",
        'Chapter 7: Cutting from "The Dailygraph"',
        "Chapter 8: Mina Murray's Journal",
        "Chapter 9: Letter, Mina Harker to Lucy Westenra",
        "Chapter 10: Letter, Dr. Seward to Hon. Arthur Holmwood",
        "Chapter 11: Lucy Westenra's Diary",
        "Chapter 12: Dr. Seward's Diary",
        "Chapter 13: Dr. Seward's Diary (Continued)",
        "Chapter 14: Mina Harker's Journal",
        "Chapter 15: Dr. Seward's Diary (Continued)",
        "Chapter 16: Dr. Seward's Diary (Continued)",
        "Chapter 17: Dr. Seward's Diary (Continued)",
        "Chapter 18: Dr. Seward's Diary (Continued)",
        "Chapter 19: Jonathan Harker's Journal",
        "Chapter 20: Jonathan Harker's Journal (Continued)",
        "Chapter 21: Dr. Seward's Diary",
        "Chapter 22: Jonathan Harker's Journal",
        "Chapter 23: Dr. Seward's Diary",
        "Chapter 24: Dr. Seward's Diary (Continued)",
        "Chapter 25: Dr. Seward's Diary",
        "Chapter 26: Dr. Seward's Diary (Continued)",
        "Chapter 27: Mina Harker's Journal",
      ],
      "treasure-island": [
        "Chapter 1: The Old Sea-dog at the Admiral Benbow",
        "Chapter 2: Black Dog Appears and Disappears",
        "Chapter 3: The Black Spot",
        "Chapter 4: The Sea-chest",
        "Chapter 5: The Last of the Blind Man",
        "Chapter 6: The Captain's Papers",
        "Chapter 7: I Go to Bristol",
        "Chapter 8: At the Sign of the Spy-glass",
        "Chapter 9: Powder and Arms",
        "Chapter 10: What I Heard in the Apple Barrel",
        "Chapter 11: What I Heard in the Apple Barrel",
        "Chapter 12: How My Shore Adventure Began",
        "Chapter 13: The First Blow",
        "Chapter 14: The Man of the Island",
        "Chapter 15: What the Owner Saw",
        "Chapter 16: The Doctor Continues the Story",
        "Chapter 17: The Jolly-boat's Last Trip",
        "Chapter 18: End of the First Day's Fighting",
        "Chapter 19: Narrative Resumed by Jim Hawkins",
        "Chapter 20: Silver's Embassy",
        "Chapter 21: The Attack",
        "Chapter 22: How I Began My Sea Adventure",
        "Chapter 23: The Ebb-tide Runs",
        "Chapter 24: The Cruise of the Coracle",
        "Chapter 25: I Strike the Jolly Roger",
        "Chapter 26: Israel Hands",
        'Chapter 27: "Pieces of Eight"',
        "Chapter 28: In the Enemy's Camp",
        "Chapter 29: The Black Spot Again",
        "Chapter 30: On Parole",
        "Chapter 31: The Treasure-hunt—Flint's Pointer",
        "Chapter 32: The Treasure-hunt—The Voice Among the Trees",
        "Chapter 33: The Fall of a Chieftain",
        "Chapter 34: And Last",
      ],
      frankenstein: [
        "Chapter 1: Letter I",
        "Chapter 2: Letter II",
        "Chapter 3: Letter III",
        "Chapter 4: Letter IV",
        "Chapter 5: The Creation",
        "Chapter 6: The Monster Awakes",
        "Chapter 7: The Death of William",
        "Chapter 8: The Trial of Justine",
        "Chapter 9: The Alps",
        "Chapter 10: The Encounter",
        "Chapter 11: The Monster's Story",
        "Chapter 12: The De Lacey Family",
        "Chapter 13: Learning Language",
        "Chapter 14: The History of the Family",
        "Chapter 15: The Books",
        "Chapter 16: The Rejection",
        "Chapter 17: The Request",
        "Chapter 18: The Journey",
        "Chapter 19: The Orkney Islands",
        "Chapter 20: The Female Creature",
        "Chapter 21: The Wrath of the Monster",
        "Chapter 22: The Wedding Night",
        "Chapter 23: The Death of Elizabeth",
        "Chapter 24: The Chase",
      ],
      "a-tangled-tale": [
        "Chapter 1: Knot I - Excelsior",
        "Chapter 2: Knot II - Eligible Apartments",
        "Chapter 3: Knot III - Mad Mathesis",
        "Chapter 4: Knot IV - The Dead Reckoning",
        "Chapter 5: Knot V - Oughts and Crosses",
        "Chapter 6: Knot VI - Her Radiancy",
        "Chapter 7: Knot VII - Petty Cash",
        "Chapter 8: Knot VIII - De Omnibus Rebus",
        "Chapter 9: Knot IX - A Serpent with Corners",
        "Chapter 10: Knot X - Chelsea Buns",
      ],
      "pride-and-prejudice": [
        "Chapter 1: A Truth Universally Acknowledged",
        "Chapter 2: The Visit",
        "Chapter 3: The Assembly Ball",
        "Chapter 4: Jane and Bingley",
        "Chapter 5: The Lucases",
        "Chapter 6: The Developing Affection",
        "Chapter 7: The Netherfield Invitation",
        "Chapter 8: An Evening at Netherfield",
        "Chapter 9: Mrs. Bennet's Visit",
        "Chapter 10: The Reel and the Book",
        "Chapter 11: Miss Bingley's Pursuit",
        "Chapter 12: The Departure",
        "Chapter 13: Mr. Collins Arrives",
        "Chapter 14: A Dinner with Mr. Collins",
        "Chapter 15: Mr. Wickham's Introduction",
        "Chapter 16: Wickham's Tale",
        "Chapter 17: The Netherfield Ball",
        "Chapter 18: The Ball",
        "Chapter 19: Mr. Collins's Proposal",
        "Chapter 20: Mr. Bennet's Intervention",
        "Chapter 21: The Letter from Netherfield",
        "Chapter 22: Charlotte's Engagement",
        "Chapter 23: The Bennets' Reaction",
        "Chapter 24: The Bingley Sisters",
        "Chapter 25: The Gardiners' Arrival",
        "Chapter 26: Jane's Disappointment",
        "Chapter 27: The Journey to Kent",
        "Chapter 28: Arrival at Hunsford",
        "Chapter 29: The Rosings Dinner",
        "Chapter 30: The First Weeks",
        "Chapter 31: Colonel Fitzwilliam",
        "Chapter 32: Darcy's Visits",
        "Chapter 33: The Piano Forte",
        "Chapter 34: The Proposal",
        "Chapter 35: The Letter",
        "Chapter 36: Re-evaluation",
        "Chapter 37: Leaving Rosings",
        "Chapter 38: The Farewell",
        "Chapter 39: Return to Longbourn",
        "Chapter 40: News of the Militia",
        "Chapter 41: Lydia's Departure",
        "Chapter 42: The Visit to Pemberley",
        "Chapter 43: Arrival at Pemberley",
        "Chapter 44: The Meeting with Darcy",
        "Chapter 45: The Gardiners' Impression",
        "Chapter 46: The Letters of Ruin",
        "Chapter 47: The Flight of Lydia",
        "Chapter 48: Waiting for News",
        "Chapter 49: Mr. Gardiner's Letter",
        "Chapter 50: The Bennets' Relief",
        "Chapter 51: Lydia's Return",
        "Chapter 52: The Secret Unraveled",
        "Chapter 53: The Bingley Return",
        "Chapter 54: The Dinner at Longbourn",
        "Chapter 55: The Engagement",
        "Chapter 56: Lady Catherine's Visit",
        "Chapter 57: The Rumours",
        "Chapter 58: The Second Proposal",
        "Chapter 59: The Bennets' Joy",
        "Chapter 60: The Resolution",
        "Chapter 61: Happily Ever After",
      ],
      emma: [
        "Chapter 1: The Matchmaker",
        "Chapter 2: The Weston Wedding",
        "Chapter 3: Harriet Smith",
        "Chapter 4: Mr. Elton",
        "Chapter 5: The Vicar's Visit",
        "Chapter 6: The Portrait",
        "Chapter 7: The Charade",
        "Chapter 8: The Snow Storm",
        "Chapter 9: Mr. Elton's Proposal",
        "Chapter 10: The Disappointment",
        "Chapter 11: The Arrival of Frank Churchill",
        "Chapter 12: The Dinner Party",
        "Chapter 13: The Piano Forte",
        "Chapter 14: The Box Hill Picnic",
        "Chapter 15: The Insult",
        "Chapter 16: Mr. Knightley's Rebuke",
        "Chapter 17: The Secret Engagement",
        "Chapter 18: The Death of Mrs. Churchill",
        "Chapter 19: The Confession",
        "Chapter 20: The Ball at the Crown",
        "Chapter 21: The Elopement",
        "Chapter 22: The Discovery",
        "Chapter 23: The Aftermath",
        "Chapter 24: Harriet's Confession",
        "Chapter 25: Mr. Knightley's Jealousy",
        "Chapter 26: The Proposal",
        "Chapter 27: The Wedding",
        "Chapter 28: The New Mrs. Knightley",
        "Chapter 29: The Return to Highbury",
        "Chapter 30: The Visit to Donwell",
        "Chapter 31: The Strawberry Picking",
        "Chapter 32: The Secret Revealed",
        "Chapter 33: The Confrontation",
        "Chapter 34: The Rejection",
        "Chapter 35: The Explanation",
        "Chapter 36: The Forgiveness",
        "Chapter 37: The Reconciliation",
        "Chapter 38: The Engagement",
        "Chapter 39: The Wedding Preparations",
        "Chapter 40: The Final Goodbye",
        "Chapter 41: The New Life",
        "Chapter 42: The Letter from Frank",
        "Chapter 43: The Truth About Jane",
        "Chapter 44: The Highbury Gossip",
        "Chapter 45: The Dinner at Hartfield",
        "Chapter 46: The Proposal Accepted",
        "Chapter 47: The Approval of Mr. Woodhouse",
        "Chapter 48: The Wedding Day",
        "Chapter 49: The Honeymoon",
        "Chapter 50: The Return to Hartfield",
        "Chapter 51: The Visit from Harriet",
        "Chapter 52: The News of Mr. Martin",
        "Chapter 53: The Final Resolution",
        "Chapter 54: The Peace of Highbury",
        "Chapter 55: The Happy Ending",
      ],
      "sense-and-sensibility": [
        "Chapter 1: The Dashwood Inheritance",
        "Chapter 2: The New Mistress of Norland",
        "Chapter 3: The Departure",
        "Chapter 4: The Cottage at Barton",
        "Chapter 5: The Arrival of Colonel Brandon",
        "Chapter 6: The Meeting with Willoughby",
        "Chapter 7: The Picnic at Delaford",
        "Chapter 8: The Secret Engagement",
        "Chapter 9: The Journey to London",
        "Chapter 10: The Confrontation",
        "Chapter 11: The Letter",
        "Chapter 12: The Revelation",
        "Chapter 13: The Illness",
        "Chapter 14: The Return to Barton",
        "Chapter 15: The Confession",
        "Chapter 16: The Proposal",
        "Chapter 17: The Wedding Preparations",
        "Chapter 18: The Marriage",
        "Chapter 19: The New Life",
        "Chapter 20: The Unexpected Visitor",
        "Chapter 21: The Truth Unveiled",
        "Chapter 22: The Reunion",
        "Chapter 23: The Secret of the Past",
        "Chapter 24: The Journey to Cleveland",
        "Chapter 25: The Fever",
        "Chapter 26: The Recovery",
        "Chapter 27: The Letter from Colonel Brandon",
        "Chapter 28: The Confession of Willoughby",
        "Chapter 29: The Forgiving Heart",
        "Chapter 30: The Return to Delaford",
        "Chapter 31: The Engagement of Elinor",
        "Chapter 32: The Wedding of Marianne",
        "Chapter 33: The Birth of the Heir",
        "Chapter 34: The Death of Mrs. Ferrars",
        "Chapter 35: The Return to Norland",
        "Chapter 36: The New Generation",
        "Chapter 37: The Legacy of the Dashwoods",
        "Chapter 38: The Reunion of the Sisters",
        "Chapter 39: The Family Gathering",
        "Chapter 40: The Final Resolution",
        "Chapter 41: The Journey to London",
        "Chapter 42: The Encounter",
        "Chapter 43: The Discovery",
        "Chapter 44: The Broken Engagement",
        "Chapter 45: The Heartbreak",
        "Chapter 46: The Consolation",
        "Chapter 47: The Secret Marriage",
        "Chapter 48: The Threat",
        "Chapter 49: The Duel",
        "Chapter 50: The Happy Ending",
      ],
      "jane-eyre": [
        "Chapter 1: The Reed Household",
        "Chapter 2: The Red Room",
        "Chapter 3: Mr. Lloyd's Visit",
        "Chapter 4: Mr. Brocklehurst",
        "Chapter 5: Arrival at Lowood",
        "Chapter 6: Helen Burns",
        "Chapter 7: The Harsh Winter",
        "Chapter 8: The Visit of Mr. Brocklehurst",
        "Chapter 9: The Death of Helen",
        "Chapter 10: Eight Years Later",
        "Chapter 11: Thornfield Hall",
        "Chapter 12: The Meeting on the Road",
        "Chapter 13: The Master of Thornfield",
        "Chapter 14: The First Conversation",
        "Chapter 15: The Mysterious Laugh",
        "Chapter 16: The Arrival of the Guests",
        "Chapter 17: The Game of Charades",
        "Chapter 18: The Fortune Teller",
        "Chapter 19: The Cry for Help",
        "Chapter 20: The Secret Revealed",
        "Chapter 21: Return to Gateshead",
        "Chapter 22: The Dying Aunt",
        "Chapter 23: The Proposal",
        "Chapter 24: The Wedding Plans",
        "Chapter 25: The Shattered Vows",
        "Chapter 26: The Madwoman in the Attic",
        "Chapter 27: The Flight from Thornfield",
        "Chapter 28: The Moor House",
        "Chapter 29: The Rivers Family",
        "Chapter 30: The Village School",
        "Chapter 31: The Inheritance",
        "Chapter 32: St. John's Proposal",
        "Chapter 33: The Mysterious Call",
        "Chapter 34: Return to Ferndean",
        "Chapter 35: The Reunion",
        "Chapter 36: The Blind Master",
        "Chapter 37: The Heir",
        "Chapter 38: The Happy Ending",
      ],
      "wuthering-heights": [
        "Chapter 1: The Arrival at Wuthering Heights",
        "Chapter 2: Mr. Lockwood's Illness",
        "Chapter 3: The Ghost of Catherine",
        "Chapter 4: The History of Heathcliff",
        "Chapter 5: The Death of Mr. Earnshaw",
        "Chapter 6: Hindley's Return",
        "Chapter 7: Catherine and Edgar",
        "Chapter 8: The Disgrace of Heathcliff",
        "Chapter 9: The Marriage of Catherine",
        "Chapter 10: The Return of Heathcliff",
        "Chapter 11: Isabella's Infatuation",
        "Chapter 12: The Elopement",
        "Chapter 13: The Wedding and the Illness",
        "Chapter 14: Heathcliff's Cruelty",
        "Chapter 15: The Final Meeting",
        "Chapter 16: The Death of Catherine",
        "Chapter 17: The Birth of Cathy",
        "Chapter 18: Isabella's Escape",
        "Chapter 19: The Young Cathy",
        "Chapter 20: Cathy at Wuthering Heights",
        "Chapter 21: The Forbidden Friendship",
        "Chapter 22: The Trap",
        "Chapter 23: The Abuse of Cathy",
        "Chapter 24: The Secret Visits",
        "Chapter 25: The Death of Edgar",
        "Chapter 26: The Marriage of Cathy",
        "Chapter 27: The End of Linton",
        "Chapter 28: The Death of Heathcliff",
        "Chapter 29: The Haunting",
        "Chapter 30: The Next Generation",
        "Chapter 31: The Union of Hareton and Cathy",
        "Chapter 32: The Final Years",
        "Chapter 33: The Peaceful End",
        "Chapter 34: The Epilogue",
      ],
      "a-farewell-to-arms": [
        "Chapter 1: The Village",
        "Chapter 2: The Front",
        "Chapter 3: The Major",
        "Chapter 4: The Battery",
        "Chapter 5: The Wound",
        "Chapter 6: The Field Hospital",
        "Chapter 7: The Priest",
        "Chapter 8: The Retreat",
        "Chapter 9: The Bridge",
        "Chapter 10: The Escape",
        "Chapter 11: The Lake",
        "Chapter 12: Milan",
        "Chapter 13: The American Hospital",
        "Chapter 14: Catherine",
        "Chapter 15: The Races",
        "Chapter 16: The Rain",
        "Chapter 17: The Return",
        "Chapter 18: The Arrest",
        "Chapter 19: The Train",
        "Chapter 20: Switzerland",
        "Chapter 21: The Mountains",
        "Chapter 22: The Cabin",
        "Chapter 23: The Winter",
        "Chapter 24: The Baby",
        "Chapter 25: The Labor",
        "Chapter 26: The Loss",
        "Chapter 27: The End",
        "Chapter 28: The Aftermath",
        "Chapter 29: The Return Home",
        "Chapter 30: The Memories",
        "Chapter 31: The Silence",
        "Chapter 32: The Letters",
        "Chapter 33: The Reunion",
        "Chapter 34: The Truth",
        "Chapter 35: The Farewell",
        "Chapter 36: The Journey",
        "Chapter 37: The New Life",
        "Chapter 38: The Shadow",
        "Chapter 39: The Light",
        "Chapter 40: The Promise",
        "Chapter 41: The Final Goodbye",
      ],
      "ben-hur": [
        "Chapter 1: The Desert Meeting",
        "Chapter 2: The Star in the East",
        "Chapter 3: The Arrival at Bethlehem",
        "Chapter 4: The Magi's Gift",
        "Chapter 5: The Flight to Egypt",
        "Chapter 6: Return to Jerusalem",
        "Chapter 7: The House of Hur",
        "Chapter 8: The Young Prince",
        "Chapter 9: The Roman Tribune",
        "Chapter 10: The Accident",
        "Chapter 11: The Betrayal",
        "Chapter 12: The Galley Slave",
        "Chapter 13: The Sea Battle",
        "Chapter 14: The Rescue",
        "Chapter 15: Rome and Arrius",
        "Chapter 16: The Chariot Race",
        "Chapter 17: The Return East",
        "Chapter 18: Reunion with Balthasar",
        "Chapter 19: The Leper Colony",
        "Chapter 20: The Valley of the Dead",
        "Chapter 21: The Journey to Antioch",
        "Chapter 22: The Charioteer",
        "Chapter 23: The Games of Daphne",
        "Chapter 24: The Challenge",
        "Chapter 25: The Great Race",
        "Chapter 26: The Fall of Messala",
        "Chapter 27: The Aftermath",
        "Chapter 28: The Search for Answers",
        "Chapter 29: The Preacher in the Desert",
        "Chapter 30: The Baptism",
        "Chapter 31: The Gathering Storm",
        "Chapter 32: The Entry into Jerusalem",
        "Chapter 33: The Cleansing of the Temple",
        "Chapter 34: The Sermon on the Mount",
        "Chapter 35: The Plot",
        "Chapter 36: The Betrayal of Christ",
        "Chapter 37: The Trial",
        "Chapter 38: The Crucifixion",
        "Chapter 39: The Darkness",
        "Chapter 40: The Resurrection",
        "Chapter 41: The Conversion of Judah",
        "Chapter 42: The Healing Waters",
        "Chapter 43: The Finding of Tirzah",
        "Chapter 44: The Mother's Healing",
        "Chapter 45: The New Life",
        "Chapter 46: The Church Begins",
        "Chapter 47: The Persecution",
        "Chapter 48: The Faith Tested",
        "Chapter 49: The Roman Edict",
        "Chapter 50: The Catacombs",
        "Chapter 51: The Letters of Paul",
        "Chapter 52: The Journey to Rome",
        "Chapter 53: The Arena of Nero",
        "Chapter 54: The Lions",
        "Chapter 55: The Martyrdom of Peter",
        "Chapter 56: The Fall of the Emperor",
        "Chapter 57: The Siege of Jerusalem",
        "Chapter 58: The Destruction of the Temple",
        "Chapter 59: The Remnant",
        "Chapter 60: The Legacy of Judah",
        "Chapter 61: The New Generation",
        "Chapter 62: The Hidden Scrolls",
        "Chapter 63: The Journey West",
        "Chapter 64: The Roman Church",
        "Chapter 65: The Final Days",
        "Chapter 66: The Vision of Balthasar",
        "Chapter 67: The Peace of Christ",
        "Chapter 68: The Reunion in Heaven",
        "Chapter 69: The End of the Journey",
        "Chapter 70: The New Jerusalem",
        "Chapter 71: The Eternal Kingdom",
        "Chapter 72: The Witness of the Martyrs",
        "Chapter 73: The Glory of the Cross",
        "Chapter 74: The Song of the Angels",
        "Chapter 75: The Light of the World",
        "Chapter 76: The Prince of Peace",
        "Chapter 77: The Final Victory",
        "Chapter 78: The Legacy of Faith",
        "Chapter 79: The End of the Tale",
        "Chapter 80: Epilogue: The Christ",
      ],
      "nicomachean-ethics": [
        "Book 1: The Good for Man",
        "Book 2: Moral Virtue",
        "Book 3: Voluntary Action and Choice",
        "Book 4: The Liberal Virtues",
        "Book 5: Justice",
        "Book 6: Intellectual Virtue",
        "Book 7: Continence and Incontinence",
        "Book 8: Friendship",
        "Book 9: Friendships and the Good Life",
        "Book 10: Pleasure and Happiness",
      ],
      "poor-jack": [
        "Chapter 1: The Author's Account of Himself",
        "Chapter 2: In which the Author is introduced",
        "Chapter 3: A Chapter of Accidents",
        "Chapter 4: The Old Pensioner",
        "Chapter 5: The Hospital",
        "Chapter 6: The Funeral",
        "Chapter 7: The Will",
        "Chapter 8: The New Home",
        "Chapter 9: The River",
        "Chapter 10: The Wreck",
        "Chapter 11: The Rescue",
        "Chapter 12: The Reward",
        "Chapter 13: The Apprentice",
        "Chapter 14: The First Voyage",
        "Chapter 15: The Storm",
        "Chapter 16: The Mutiny",
        "Chapter 17: The Island",
        "Chapter 18: The Treasure",
        "Chapter 19: The Return",
        "Chapter 20: The Trial",
        "Chapter 21: The Escape",
        "Chapter 22: The Rescue",
        "Chapter 23: The Journey",
        "Chapter 24: The Homecoming",
        "Chapter 25: The Reunion",
        "Chapter 26: The New Life",
        "Chapter 27: The Secret",
        "Chapter 28: The Betrayal",
        "Chapter 29: The Chase",
        "Chapter 30: The Capture",
        "Chapter 31: The Trial",
        "Chapter 32: The Verdict",
        "Chapter 33: The Prison",
        "Chapter 34: The Letter",
        "Chapter 35: The Rescue",
        "Chapter 36: The Final Voyage",
        "Chapter 37: The Shipwreck",
        "Chapter 38: The Island",
        "Chapter 39: The Discovery",
        "Chapter 40: The Return",
        "Chapter 41: The Wedding",
        "Chapter 42: The Family",
        "Chapter 43: The War",
        "Chapter 44: The Battle",
        "Chapter 45: The Wound",
        "Chapter 46: The Hospital",
        "Chapter 47: The Recovery",
        "Chapter 48: The Peace",
        "Chapter 49: The New Era",
        "Chapter 50: The Legacy",
        "Chapter 51: The Final Years",
        "Chapter 52: The End",
        "Chapter 53: The Epilogue",
        "Chapter 54: The Conclusion",
        "Chapter 55: The Farewell",
      ],
      "quo-vadis": [
        "Chapter 1",
        "Chapter 2",
        "Chapter 3",
        "Chapter 4",
        "Chapter 5",
        "Chapter 6",
        "Chapter 7",
        "Chapter 8",
        "Chapter 9",
        "Chapter 10",
        "Chapter 11",
        "Chapter 12",
        "Chapter 13",
        "Chapter 14",
        "Chapter 15",
      ],
    };

    // Helper to generate full chapter list
    const buildChapters = (bookId, count) => {
      let titles = chapterDB[bookId];

      // Fallback
      if (!titles) {
        titles = Array.from({ length: count }, (_, i) => `Chapter ${i + 1}`);
      }

      return titles.map((title, i) => {
        let body = LOREM;
        if (bookId === "a-tale-of-two-cities" && i === 0) {
          body =
            "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair...";
        } else if (bookId === "pride-and-prejudice" && i === 0) {
          body =
            "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families...";
        } else if (bookId === "dracula" && i === 0) {
          body =
            "3 May. Bistritz.—Left Munich at 8:35 P.M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place...";
        }

        return {
          number: i + 1,
          title: title,
          status: "published",
          words: body.split(/\s+/).length,
          lastUpdated: Date.now() - i * 86400000,
          body: body + "\n\n[End of Chapter " + (i + 1) + "]",
        };
      });
    };

    const staticBooks = [
      {
        id: "a-tale-of-two-cities",
        title: "A Tale of Two Cities",
        author: "Charles Dickens",
        genre: "Historical",
        synopsis:
          "A Tale of Two Cities is a historical novel published in 1859 by English author Charles Dickens, set in London and Paris before and during the French Revolution. The novel tells the story of the French Doctor Manette, his 18-year-long imprisonment in the Bastille in Paris, and his release to live in London with his daughter Lucie whom he had never met. The story is set against the conditions that led up to the French Revolution and the Reign of Terror.",
        coverImage:
          "../books/Historical/A Tale of Two Cities by Charles Dickens/a-tale-of-two-cities-9781416503064_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 12500,
        rating: 4.8,
        chapters: buildChapters("a-tale-of-two-cities", 47),
      },
      {
        id: "quo-vadis",
        title: "Quo Vadis",
        author: "Henryk Sienkiewicz",
        genre: "Historical",
        synopsis: "A narrative of the time of Nero.",
        coverImage:
          "../books/Historical/Quo Vadis A Narrative of the Time of Nero by Henryk Sienkiewicz/Quo_Vadis_Cover_v1.1.webp",
        status: "published",
        systemSeeded: true,
        reads: 9800,
        rating: 4.7,
        chapters: buildChapters("quo-vadis", 15),
      },
      {
        id: "dracula",
        title: "Dracula",
        author: "Bram Stoker",
        genre: "Horror",
        synopsis:
          "Dracula is an 1897 Gothic horror novel by Irish author Bram Stoker. It introduced the character of Count Dracula and established many conventions of subsequent vampire fantasy. The novel tells the story of Dracula's attempt to move from Transylvania to England so that he may find new blood and spread the undead curse, and of the battle between Dracula and a small group of people led by Professor Abraham Van Helsing.",
        coverImage:
          "../books/Horror(1)/Dracula by Bram Stoker/dracula-9781471141621_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 12843,
        rating: 4.8,
        chapters: buildChapters("dracula", 27),
      },
      {
        id: "pride-and-prejudice",
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        synopsis:
          "Pride and Prejudice is a romantic novel of manners written by Jane Austen. The novel follows the character development of Elizabeth Bennet, the dynamic protagonist of the book who learns about the repercussions of hasty judgments and comes to appreciate the difference between superficial goodness and actual goodness. When the wealthy and aloof Mr. Darcy enters her life, pride and prejudice collide, leading to a journey of self-discovery and unexpected love.",
        coverImage:
          "../books/Romance/Pride and Prejudice by Jane Austen/pride-and-prejudice-9781471134746_hr.jpg",
        status: "published",
        systemSeeded: true,
        reads: 15000,
        rating: 4.9,
        chapters: buildChapters("pride-and-prejudice", 61),
      },
      {
        id: "treasure-island",
        title: "Treasure Island",
        author: "Robert Louis Stevenson",
        genre: "Action",
        synopsis:
          "For sheer storytelling delight and pure adventure, Treasure Island has never been surpassed. From the moment young Jim Hawkins first encounters the sinister Blind Pew at the Admiral Benbow Inn until the climactic battle for treasure on a tropic isle, the novel creates scenes and characters that have fired the imaginations of generations of readers. Written by a superb prose stylist, a master of both action and atmosphere, the story centers upon the conflict between good and evil—but in this case a particularly exciting and dangerous evil, the one-legged pirate Long John Silver.",
        coverImage:
          "../books/Adventure & Action/Treasure Island by Robert Louis Stevenson/cvr9781416500292_9781416500292_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 11000,
        rating: 4.6,
        chapters: buildChapters("treasure-island", 34),
      },
      {
        id: "a-farewell-to-arms",
        title: "A Farewell to Arms",
        author: "Ernest Hemingway",
        genre: "Action",
        synopsis:
          'A Farewell to Arms is a novel by Ernest Hemingway set during the Italian campaign of World War I. The book, published in 1929, is a first-person account of American Frederic Henry, serving as a lieutenant ("tenente") in the ambulance corps of the Italian Army. The novel is a love story between Henry and Catherine Barkley, an English nurse, set against the backdrop of the brutal realities of war, exploring themes of love, loss, and the disillusionment of the Lost Generation.',
        coverImage:
          "../books/Action/A_Farewell_to_Arms by Ernest_Hemingway (Unzipped Files)/A_Farewell_to_Arms cover art.png",
        status: "published",
        systemSeeded: true,
        reads: 8500,
        rating: 4.5,
        chapters: buildChapters("a-farewell-to-arms", 41),
      },
      {
        id: "ben-hur",
        title: "Ben-Hur: A Tale of the Christ",
        author: "Lew Wallace",
        genre: "Action",
        synopsis:
          "Ben-Hur: A Tale of the Christ is a novel by Lew Wallace, published in 1880. It is considered the most influential Christian book of the nineteenth century. The story recounts in descriptive detail the adventures of Judah Ben-Hur, a fictional Jewish prince from Jerusalem who is enslaved by the Romans at the beginning of the 1st century and becomes a charioteer and a Christian. Running in parallel with Judah's narrative is the unfolding story of Jesus, who comes from the same region and around the same age.",
        coverImage:
          "../books/Action/Ben-Hur_A_Tale_of_the_Christ  by Lew_Wallace (Unzipped Files)/Ben-Hur_A_Tale_of_the_Christ- cover art.png",
        status: "published",
        systemSeeded: true,
        reads: 7200,
        rating: 4.4,
        chapters: buildChapters("ben-hur", 80),
      },
      {
        id: "nicomachean-ethics",
        title: "Nicomachean Ethics",
        author: "Aristotle",
        genre: "Action",
        synopsis:
          "The Nicomachean Ethics is Aristotle's best-known work on ethics, the science of the good for human life, which is the pursuit of happiness. It is widely considered one of the most important historical philosophical works, and had an important impact upon the European Middle Ages and modern philosophy. The work is divided into ten books, exploring virtue, friendship, pleasure, and the contemplative life.",
        coverImage:
          "../books/Action/Nicomachean_Ethics by Aristotle (Unzipped Files)/Nicomachean_Ethics- cover art.png",
        status: "published",
        systemSeeded: true,
        reads: 5000,
        rating: 4.2,
        chapters: buildChapters("nicomachean-ethics", 10),
      },
      {
        id: "poor-jack",
        title: "Poor Jack",
        author: "Frederick Marryat",
        genre: "Action",
        synopsis:
          'Poor Jack is a novel by Frederick Marryat, first published in 1840. The story follows the life and adventures of Thomas Saunders, a young boy who is the son of a Greenwich pensioner. Known as "Poor Jack" due to his ragged appearance, the novel chronicles his struggles, his time at sea, and his eventual rise in fortune. It is a classic nautical adventure tale, rich in maritime detail and lively characters.',
        coverImage:
          "../books/Action/Poor_Jack by Frederick_Marryat (Unzipped Files)/Poor_Jack- cover art.png",
        status: "published",
        systemSeeded: true,
        reads: 4500,
        rating: 4.1,
        chapters: buildChapters("poor-jack", 55),
      },
      {
        id: "frankenstein",
        title: "Frankenstein",
        author: "Mary Shelley",
        genre: "Historical",
        synopsis:
          "Frankenstein; or, The Modern Prometheus is an 1818 novel written by English author Mary Shelley. Frankenstein tells the story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment. Shelley started writing the story when she was 18, and the first edition was published anonymously in London on 1 January 1818, when she was 20. The novel explores themes of ambition, creation, and the consequences of playing God.",
        coverImage:
          "../books/Horror(1)/Frankenstein by Mary Shelley/frankenstein-9781398843707_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 10500,
        rating: 4.7,
        chapters: buildChapters("frankenstein", 24),
      },
      {
        id: "a-tangled-tale",
        title: "A Tangled Tale",
        author: "Lewis Carroll",
        genre: "Historical",
        synopsis:
          'A Tangled Tale is a collection of 10 brief humorous stories by Lewis Carroll, published serially between April 1880 and March 1885 in The Monthly Packet magazine. The stories, called "Knots", are presented as mathematical puzzles disguised as narrative fiction. The book follows various characters as they encounter strange situations that can only be resolved through logic and arithmetic, showcasing Carroll\'s love for both storytelling and mathematics.',
        coverImage:
          "../books/Fantasy/A_Tangled_Tale by Lewis_Carroll (Unzipped Files)/A_Tangled_Tale- cover art.png",
        status: "published",
        systemSeeded: true,
        reads: 6000,
        rating: 4.3,
        chapters: buildChapters("a-tangled-tale", 10),
      },
      {
        id: "emma",
        title: "Emma",
        author: "Jane Austen",
        genre: "Romance",
        synopsis:
          'Emma is a novel about youthful hubris and romantic misunderstandings. It is set in the fictional country village of Highbury and the surrounding estates of Hartfield, Randalls, and Donwell Abbey, and involves the relationships among people from a small number of families. The novel was first published in December 1815, with its title page listing the author simply as "the author of Pride and Prejudice". The story follows Emma Woodhouse, a clever and wealthy young woman who meddles in the love lives of her friends, only to find her own match in the most unexpected place.',
        coverImage:
          "../books/Romance/Emma by Jane Austen/cvr9781416500285_9781416500285_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 9200,
        rating: 4.6,
        chapters: buildChapters("emma", 55),
      },
      {
        id: "jane-eyre",
        title: "Jane Eyre",
        author: "Charlotte Brontë",
        genre: "Romance",
        synopsis:
          "Orphaned into the household of her Aunt Reed at Gateshead, Jane Eyre is subjected to the cruel treatment of her aunt and cousins. Sent away to Lowood Institution, she survives a harsh regime before becoming a governess at Thornfield Hall. There, she falls in love with her brooding employer, Edward Rochester, only to discover a dark and terrible secret that threatens to destroy their happiness. A novel of intense power and intrigue, Jane Eyre dazzled readers with its passionate depiction of a woman's struggle for equality and freedom.",
        coverImage:
          "../books/Romance/Jane Eyre by Charlotte Brontë/jane-eyre-9781625587091_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 13500,
        rating: 4.8,
        chapters: buildChapters("jane-eyre", 38),
      },
      {
        id: "sense-and-sensibility",
        title: "Sense and Sensibility",
        author: "Jane Austen",
        genre: "Romance",
        synopsis:
          "Sense and Sensibility is a novel by Jane Austen, published in 1811. It was published anonymously; By A Lady appears on the title page where the author's name might have been. It tells the story of the Dashwood sisters, Elinor (age 19) and Marianne (age 16½) as they come of age. They have an older half-brother, John, and a younger sister, Margaret (age 13). The novel follows the three Dashwood sisters as they must move with their widowed mother from the estate on which they grew up, Norland Park. Because Norland is passed down to John, the product of Mr. Dashwood's first marriage, and his young son, the four Dashwood women need to look for a new home. The novel explores the contrast between sense (Elinor) and sensibility (Marianne).",
        coverImage:
          "../books/Romance/Sense and Sensibility by Jane Austen/cvr9780743487764_9780743487764_lg.jpg",
        status: "published",
        systemSeeded: true,
        reads: 8800,
        rating: 4.5,
        chapters: buildChapters("sense-and-sensibility", 50),
      },
      {
        id: "wuthering-heights",
        title: "Wuthering Heights",
        author: "Emily Brontë",
        genre: "Romance",
        synopsis:
          'Wuthering Heights is a novel by Emily Brontë published in 1847 under her pseudonym "Ellis Bell". It is the only novel she wrote. The story is about the intense and almost demonic love between Catherine Earnshaw and Heathcliff, a foundling adopted by Catherine\'s father. The novel is set on the Yorkshire moors and explores themes of love, revenge, social class, and the destructive power of passion.',
        coverImage:
          "../books/Romance/Wuthering Heights by Emily Brontë/wuthering-heights-9781471137266_hr.jpg",
        status: "published",
        systemSeeded: true,
        reads: 14000,
        rating: 4.9,
        chapters: buildChapters("wuthering-heights", 34),
      },
    ];

    staticBooks.forEach((book) => {
      const existingIndex = novels.findIndex(
        (n) => String(n.id) === String(book.id),
      );
      if (existingIndex === -1) {
        novels.push(book);
        changed = true;
      } else {
        novels[existingIndex].chapters = book.chapters;
        novels[existingIndex].coverImage = book.coverImage;
        novels[existingIndex].synopsis = book.synopsis;
        novels[existingIndex].author = book.author;
        novels[existingIndex].genre = book.genre;
        novels[existingIndex].systemSeeded = true;
        changed = true;
      }
    });

    if (changed) saveNovels(novels);
  }

  seedHomepageBooks();

  function renderTable() {
    let novels = getNovels().filter(
      (n) => n.status !== "draft" && n.status !== "pending" && !n.archived,
    );
    const q = searchInput.value.trim().toLowerCase();
    if (q) novels = novels.filter((n) => n.title.toLowerCase().includes(q));

    const status = statusFilter.value.toLowerCase();
    if (status !== "all") {
      novels = novels.filter((n) => {
        const nStatus = (n.status || "ongoing").toLowerCase();
        if (status === "ongoing")
          return nStatus === "published" || nStatus === "ongoing";
        if (status === "pending review" || status === "pending")
          return nStatus === "pending";
        return nStatus === status;
      });
    }

    const sortBy = sortSelect.value;
    if (sortBy === "Reads")
      novels.sort((a, b) => (b.reads || 0) - (a.reads || 0));
    else if (sortBy === "Rating")
      novels.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else novels.sort((a, b) => a.title.localeCompare(b.title));

    tbody.innerHTML = "";
    if (novels.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--muted-foreground);">No novels found.</td></tr>`;
      updateStats();
      return;
    }

    novels.forEach((n) => {
      let badgeClass = "active",
        badgeText = "Ongoing";
      const s = (n.status || "").toLowerCase();
      if (s === "completed") {
        badgeClass = "completed";
        badgeText = "Completed";
      } else if (s === "pending" || s === "pending review") {
        badgeClass = "pending";
        badgeText = "Pending";
      } else if (s === "hiatus") {
        badgeClass = "paused";
        badgeText = "On Hiatus";
      }

      const chaptersCount = Array.isArray(n.chapters)
        ? n.chapters.filter((c) => !c.archived).length
        : 0;
      const reads = n.reads ? n.reads.toLocaleString() : "—";
      const ratingStr = n.rating
        ? `<img src="../icons/star-fill.svg" class="star-rating" alt="star"> ${n.rating}`
        : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${n.title}</strong></td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${n.genre || "—"}</td>
        <td>${chaptersCount}</td>
        <td>${reads}</td>
        <td>${ratingStr}</td>
        <td>
          <div class="action-group">
            <a class="btn btn-primary btn-sm view-novel-btn" href="admin-view-novel.html?novelId=${n.id}">View</a>
            <button class="btn btn-sm btn-archive archive-novel-btn" data-id="${n.id}">Archive</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    updateStats();
  }

  function updateStats() {
    const all = getNovels().filter((n) => n.status !== "draft" && !n.archived);
    const pending = all.filter((n) =>
      (n.status || "").toLowerCase().includes("pending"),
    ).length;
    document.getElementById("stat-total").textContent = all.length;
    document.getElementById("stat-pending").textContent = pending;
  }

  applyBtn.addEventListener("click", renderTable);
  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "All";
    sortSelect.value = "Title";
    renderTable();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renderTable();
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".archive-novel-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    const novel = getNovels().find((n) => String(n.id) === String(id));
    if (!novel) return;

    Swal.fire({
      title: "Archive this novel?",
      text: `"${novel.title}" will be moved to the Archive page.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      confirmButtonColor: "#b8721f",
      cancelButtonColor: "#6b6680",
    }).then((res) => {
      if (!res.isConfirmed) return;
      const list = getNovels();
      const target = list.find((n) => String(n.id) === String(id));
      if (target) {
        target.archived = true;
        target.archivedAt = Date.now();
        saveNovels(list);
      }
      renderTable();
      Swal.fire(
        "Archived!",
        `"${novel.title}" has been moved to the Archive.`,
        "success",
      );
    });
  });

  renderTable();
});
