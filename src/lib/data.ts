import { Lesson } from '../types';

export const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "code", "data", "speed", "key", "finger", "type", "rhythm", "fast", "light", "focus",
  "practice", "learn", "screen", "mind", "quick", "smooth", "steady", "board", "space", "flow",
  "master", "power", "skill", "brain", "habit", "motion", "target", "strike", "clean", "clack"
];

export const QUOTES = [
  {
    text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
    author: "Buddha"
  },
  {
    text: "Simplicity is the ultimate sophistication. When you streamline your thoughts, your fingers follow effortlessly.",
    author: "Leonardo da Vinci"
  },
  {
    text: "It is not that I'm so smart, it's just that I stay with problems longer until clarity emerges.",
    author: "Albert Einstein"
  },
  {
    text: "The only way to do great work is to love what you do. Stay hungry, stay foolish, and keep creating.",
    author: "Steve Jobs"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great. Rhythm builds step by step.",
    author: "Zig Ziglar"
  },
  {
    text: "Code is like humor. When you have to explain it, it is bad. Write cleanly and expressively.",
    author: "Cory House"
  }
];

export const STORY_PASSAGES = [
  "The old lighthouse keeper climbed the spiral stairs every evening to light the lamp. Tonight the sea was calm and the sky was clear, but he still made the climb, for the light had to burn no matter what. Ships far out on the dark water depended on his small flame.",
  "Maya found a curious map folded inside an old library book. It showed streets that did not exist today and a park where a shopping mall now stood. She decided to follow it anyway, and by noon she was standing where the hidden garden had once been.",
  "The bakery on the corner opened at dawn, and the smell of fresh bread drifted through the whole neighborhood. Old friends greeted one another over coffee while the baker slid warm loaves onto the wooden counter. It was a small place, but it held a thousand small joys.",
  "Ravi saved his pocket money for a whole year to buy a second-hand telescope. On the first clear night he aimed it at the moon and for a long time he simply stared, amazed that the far side of the sky had been waiting for him all along.",
  "The rain came suddenly and the street emptied in moments. A young woman opened her umbrella and smiled as a stranger shared it with her on the way to the station. Sometimes a short walk in the storm turns into a story you tell for years.",
  "In the workshop behind his house, old Tomas kept every tool his father had ever owned. He polished the brass and sharpened the blades, not because he needed them, but because they carried the memory of hands that had worked before his.",
  "Every morning the ferry carried the same passengers across the river. There was the doctor who read a paper, the teacher who graded essays, and the musician who hummed softly to himself. None of them spoke, yet they formed a quiet community of strangers.",
  "The cat arrived at their door during the first snow and refused to leave. She was thin and proud and would not accept help unless it was offered on her own terms. By spring she was part of the family, sleeping on the warm ledge above the kitchen stove.",
  "When the mountain trail came to a fork, the hikers disagreed. One path was short and steep, the other long and gentle. They chose the long one, and the extra hour brought them past a waterfall none of them had expected to see.",
  "The village clock was older than anyone could remember. It struck the hours faithfully until one winter it finally stopped. A young clockmaker who had grown up listening to it spent weeks coaxing the old gears back to life, and the whole town cheered when it sang again.",
  "Nora planted a single sunflower seed in the corner of the garden. Her children laughed that nothing would grow, but she watered it patiently every day. By late summer it rose taller than the fence, turning its great golden face toward the sun.",
  "The boat builder carved his name beneath the deck of every vessel he made. His grandchildren asked why, and he said that a good craftsman always signs his work, so that generations later someone might wonder who held the chisel.",
  "On market day the square came alive with color and noise. Farmers set out baskets of apples and pears, weavers hung bright cloth on lines, and children chased a loose dog between the stalls. It had been this way for a hundred years.",
  "The librarian knew every reader by name and by taste. When a shy student asked for something new, she did not point to the shelves. She simply handed him a slim novel and said you will like this one. She was never wrong.",
  "Sam's grandfather could fix almost anything with a length of wire and a steady hand. They spent a summer together mending radios and clocks and leaking taps, and Sam learned that patience was the most important tool in any box.",
  "The secret garden behind the old manor had been locked for decades. When a young brave gardener finally turned the rusty key, she found roses as tall as the wall and a pond thick with golden fish. Some mysteries are worth the wait.",
  "At dawn the fishermen hauled their nets aboard and sorted the shining catch. A storm was coming, but the sea was still generous this morning. They worked quickly, sharing stories and laughing against the rumble of far-off thunder.",
  "The station master's pocket watch had stopped twice in the last month. He knew every train by the sound of its wheels, and he did not trust the new digital board. Like the sailors of old, he read the sky and the rails instead of the screen.",
  "Priya decided to learn the guitar at forty, and her fingers ached for weeks. Yet every evening she sat by the window and practised the same three chords until the whole apartment filled with music. It is never too late to begin.",
  "The small motorbike had carried four generations to school and work and weddings. When it finally coughed to a stop, the family did not scrap it. They rebuilt it together, remembering the journeys it had already made.",
  "The baker's granddaughter did not like the early start, but she loved the dough. She learned that a good loaf needs time, warmth, and a patient touch, and that rushing only ever made flat, hard bread. Years later she opened her own little shop.",
  "Two friends built a tree house at the edge of the wood in a single summer. They nailed every board and painted the walls sky blue. It tilted slightly and creaked in the wind, but it was the finest thing they had ever made.",
  "The night guard walked his rounds through the quiet museum, past paintings and statues that had outlived their owners. In the stillness he felt the weight of all those years, and he understood that his job was simply to keep the story safe.",
  "Elena's grandmother showed her how to make the perfect cup of tea, pouring from a great height so the air could cool it. It was a small ritual, but every evening they repeated it, and the ritual held their family together through the busy years.",
  "The young runner trained before sunrise along the empty river path. Her coach said she was too small for the long distance, but she kept going, step by step, until one spring morning she crossed the finish line first.",
  "When the power went out, the neighborhood gathered on the rooftops to watch the stars appear, one by one, in the dark city sky. Strangers introduced themselves and passed around a flask of coffee. The lights returned, but no one hurried back inside.",
  "The zookeeper knew every animal by name and mood. The old elephant remembered her even after she returned from a long absence, lifting his trunk in greeting the moment she walked into the yard. Bonds built with patience do not fade.",
  "A lost letter in a bottle washed up on the beach, written thirty years ago and never sent. The finder read it aloud to the fishermen, and together they imagined the young writer and the love that the ocean had carried so long.",
  "The tailor's shop smelled of wool and thread. He mended torn sleeves and shortened hems, but his real gift was listening. People came for repairs and stayed to pour out their troubles, trusting the quiet man with the measuring tape.",
  "It rained for nine days straight, and the river rose toward the bridge. The families carried their belongings to higher ground, helping one another through the mud. When the waters finally fell, they returned together to rebuild the little town.",
  "The young chef burned the first three pancakes before she found the secret. Patience, not heat, made the perfect golden edge. From then on she cooked slowly and proudly, turning a kitchen disaster into her signature breakfast.",
  "Every evening the old man walked the same three blocks to feed the stray dogs that waited beneath the street lamp. They knew his footsteps and greeted him with wagging tails. His small kindness kept the cold nights a little warmer.",
  "The clockmaker's daughter could hear the difference between a smooth and a worn gear just by closing her eyes. Her father taught her that a machine, like a person, tells you its troubles if you only take the time to listen.",
  "When the new bridge was finally opened, the townspeople walked across it in silence before the cars were allowed. Children ran ahead, and grandparents paused at the middle to feel the wind. It was more than steel; it was a promise kept.",
  "The library's oldest book had a torn cover and hand-written notes in its margins. A young reader spent an entire winter deciphering the faded handwriting. Buried inside was a recipe, a love letter, and a map to a tree that no longer stood.",
  "The fisherman's son was afraid of the deep water until his father taught him to float on his back and look at the clouds. From that day the sea was not a terror but a friend, and every boat ride felt like coming home.",
  "In the tiny apartment, the family grew tomatoes on the windowsill in old tin cans. They argued only over who would water them first. When the first red fruit ripened, they shared it sliced thinly, and it tasted like sunshine.",
  "The school bus driver knew every child's stop by heart and every child's name. On rainy mornings she carried spare umbrellas, and on sad ones she told funny stories. She never realized how many hearts she quietly carried with her.",
  "The artist could not afford new paint, so she mixed colors from crushed berries and brick dust. Her garden paintings gained a warmth no tube of paint could match. Sometimes limits show us the real depth of our imagination.",
  "A heavy snow fell overnight and the whole town woke muffled and white. Neighbors appeared with shovels before anyone had asked, clearing driveways and paths. By sunrise the streets were open again, and everyone agreed the cold had brought them closer.",
  "The boy's grandmother taught him to knit one winter, and he laughed at the slow, clumsy stitches. But by spring he had made a patchwork scarf three meters long. It was crooked and warm, and it wrapped up the whole season's patience.",
  "The newsstand owner had watched the city change for forty years. People still stopped for newspapers and a friendly argument about the weather. He said the world got faster every day, but a good conversation never went out of style.",
  "Two cyclists climbed the hill side by side, neither willing to let the other win. At the top, breathless and laughing, they agreed it was a draw and shared a bottle of water. The best races, they decided, end with both friends smiling.",
  "The grandmother's viola had a crack that ran the length of its body, but she never had it repaired. She said the crack made the sound softer, like a voice that had aged well. Her music filled the room with a gentle golden light.",
  "The lighthouse keeper's granddaughter visited every summer and helped him polish the great lens. He told her the light was not for the ships that found their way, but for the ones that had lost theirs. She never forgot those words.",
  "When the bakery burned down, the whole street smelled of smoke for days. But the baker rebuilt with the help of neighbors who brought bread from their own ovens. Within a year, the warm smell returned, and the bell above the door rang again.",
  "The young astronaut studied the night sky through a borrowed telescope, dreaming of stars too far to reach. Years later, looking out a real window in orbit, she remembered that borrowed telescope and the promise it had made.",
  "The kind teacher stayed after school to help a struggling student master long division. They drew apples and boats in the margins until the numbers finally made sense. The student never forgot that an hour of patience changed everything.",
  "On the last day of autumn, the leaf blower finally rested and the rakes came out. Families piled golden leaves into huge mounds and jumped into them without shame. It was the messiest, happiest chore of the whole year.",
];

export const CODE_SNIPPETS = [
  // C Programming Language
  {
    title: "C - Hello World Main Function",
    text: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}"
  },
  {
    title: "C - Pointer Swapping & Variables",
    text: "void swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}"
  },
  {
    title: "C - Dynamic Memory Allocation",
    text: "int *arr = (int *)malloc(10 * sizeof(int));\nif (arr != NULL) {\n    for (int i = 0; i < 10; i++) arr[i] = i * 2;\n    free(arr);\n}"
  },
  {
    title: "C - Binary Search Algorithm",
    text: "int binarySearch(int arr[], int low, int high, int x) {\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == x) return mid;\n        if (arr[mid] < x) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}"
  },

  // C++ Programming Language
  {
    title: "C++ - Standard I/O & Main",
    text: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Welcome to C++ Programming!\" << endl;\n    return 0;\n}"
  },
  {
    title: "C++ - Vector & Algorithm Sort",
    text: "#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {42, 12, 88, 3, 27};\n    std::sort(nums.begin(), nums.end());\n    return 0;\n}"
  },
  {
    title: "C++ - Class & Constructor",
    text: "class Rectangle {\nprivate:\n    double width, height;\npublic:\n    Rectangle(double w, double h) : width(w), height(h) {}\n    double getArea() const { return width * height; }\n};"
  },

  // Python Programming Language
  {
    title: "Python - Fibonacci Generator",
    text: "def fibonacci(n: int):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(10)))"
  },
  {
    title: "Python - File Processing & Comprehension",
    text: "with open('data.txt', 'r') as file:\n    lines = [line.strip().upper() for line in file if line.strip()]\n\nprint(f'Processed {len(lines)} lines')"
  },
  {
    title: "Python - QuickSort Algorithm",
    text: "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)"
  },
  {
    title: "Python - Async Request Handler",
    text: "import asyncio\n\nasync def fetch_user_data(user_id: int) -> dict:\n    await asyncio.sleep(0.5)\n    return {\"id\": user_id, \"status\": \"active\", \"verified\": True}"
  },

  // Java Programming Language
  {
    title: "Java - Standard Main Class",
    text: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java Developers!\");\n    }\n}"
  },
  {
    title: "Java - OOP Class & Encapsulation",
    text: "public class BankAccount {\n    private String accountNumber;\n    private double balance;\n\n    public BankAccount(String accNo, double initialBalance) {\n        this.accountNumber = accNo;\n        this.balance = initialBalance;\n    }\n\n    public void deposit(double amount) {\n        if (amount > 0) this.balance += amount;\n    }\n}"
  },
  {
    title: "Java - Stream Filter & Collect",
    text: "import java.util.*;\nimport java.util.stream.*;\n\nList<String> names = Arrays.asList(\"Alice\", \"Bob\", \"Charlie\", \"Anna\");\nList<String> filtered = names.stream()\n    .filter(n -> n.startsWith(\"A\"))\n    .map(String::toUpperCase)\n    .collect(Collectors.toList());"
  },

  // JavaScript / TypeScript
  {
    title: "JavaScript - Async Fetch & JSON",
    text: "async function getUserProfile(userId) {\n    try {\n        const response = await fetch(`/api/users/${userId}`);\n        const data = await response.json();\n        return data;\n    } catch (error) {\n        console.error('Failed to load profile:', error);\n    }\n}"
  },
  {
    title: "TypeScript - Interface & Generics",
    text: "interface ApiResponse<T> {\n    status: number;\n    success: boolean;\n    data: T;\n    timestamp: string;\n}\n\nconst response: ApiResponse<string[]> = {\n    status: 200,\n    success: true,\n    data: ['apple', 'banana', 'cherry'],\n    timestamp: new Date().toISOString()\n};"
  },

  // Rust Programming Language
  {
    title: "Rust - Enum & Pattern Matching",
    text: "enum Status {\n    Success(String),\n    Error(u32),\n}\n\nfn process_status(status: Status) {\n    match status {\n        Status::Success(msg) => println!(\"OK: {}\", msg),\n        Status::Error(code) => eprintln!(\"Error code: {}\", code),\n    }\n}"
  },

  // Go (Golang)
  {
    title: "Go - HTTP Handler Function",
    text: "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n)\n\nfunc helloHandler(w http.ResponseWriter, r *http.Request) {\n    fmt.Fprintf(w, \"Hello, World from Go!\")\n}\n\nfunc main() {\n    http.HandleFunc(\"/\", helloHandler)\n    http.ListenAndServe(\":8080\", nil)\n}"
  }
];

export const TUTORIAL_LESSONS: Lesson[] = [
  // ================= HOME ROW (Levels 1 - 3) =================
  {
    id: "lesson-home-1",
    category: "Home Row",
    title: "Home Row Foundations (F J A K)",
    level: 1,
    description: "Anchor your index fingers on F and J (feel the tactile bumps!), and rest left hand on A S D F and right hand on J K L ;",
    targetKeys: ["f", "j", "a", "k"],
    steps: [
      {
        id: "step-1",
        title: "Index Fingers Anchor",
        targetKeys: ["f", "j"],
        description: "Press F with left index finger and J with right index finger.",
        promptText: "ff jj ff jj ffff jjjj fjfj jfjf fff jjj fj",
        fingerGuide: "Left Index -> F | Right Index -> J"
      },
      {
        id: "step-2",
        title: "Pinkies & Middle Fingers",
        targetKeys: ["a", "k"],
        description: "Reach A with left pinky and K with right middle finger.",
        promptText: "aa kk aa kk akak kaka fa jk af kj fa kj",
        fingerGuide: "Left Pinky -> A | Right Middle -> K"
      },
      {
        id: "step-3",
        title: "Home Row Combo 1",
        targetKeys: ["f", "j", "a", "k"],
        description: "Combine your index, middle, and pinky fingers in smooth rhythm.",
        promptText: "fajk kfaj jafk kafa fjak ajfk kfja ajkf",
        fingerGuide: "Keep wrists level and rest fingers gently"
      }
    ]
  },
  {
    id: "lesson-home-2",
    category: "Home Row",
    title: "Complete Home Row (S D L ; G H)",
    level: 2,
    description: "Master all 10 keys of the home row including center extensions G and H.",
    targetKeys: ["s", "d", "l", ";", "g", "h"],
    steps: [
      {
        id: "step-1",
        title: "S, D, L and Semicolon",
        targetKeys: ["s", "d", "l", ";"],
        description: "Left ring on S, left middle on D, right ring on L, right pinky on ;",
        promptText: "asdf jkl; asdf jkl; sad dad lad ask fall glad",
        fingerGuide: "Left Ring -> S, Left Middle -> D, Right Ring -> L"
      },
      {
        id: "step-2",
        title: "Center Reaches (G & H)",
        targetKeys: ["g", "h"],
        description: "Reach left index over to G, and right index over to H.",
        promptText: "fg jh fg jh gash dash flash glad half hall slag",
        fingerGuide: "Left Index stretch -> G | Right Index stretch -> H"
      },
      {
        id: "step-3",
        title: "Full Home Row Words",
        targetKeys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        description: "Type complete English words using only the home row!",
        promptText: "fall glad flash glass shall salad flask gas dash half",
        fingerGuide: "Always return fingers to resting anchor position"
      }
    ]
  },
  {
    id: "lesson-home-3",
    category: "Home Row",
    title: "Home Row Speed & Cadence",
    level: 3,
    description: "Build rhythmic muscle memory and fluid typing speed across all home row keys without looking down.",
    targetKeys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
    steps: [
      {
        id: "step-1",
        title: "Left-Right Alternating Flow",
        targetKeys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        description: "Alternate quickly between left and right hands.",
        promptText: "fad gas had lad lag fash gash dash slash flask",
        fingerGuide: "Alternate hands cleanly for natural rhythm"
      },
      {
        id: "step-2",
        title: "Home Row Flow Drills",
        targetKeys: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        description: "Focus on zero pauses between word transitions.",
        promptText: "all lads shall ask dad for a salad and half a glass",
        fingerGuide: "Maintain light tactile pressure on every strike"
      },
      {
        id: "step-3",
        title: "Home Row Sprint",
        targetKeys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        description: "Type at peak cadence while maintaining 98%+ accuracy.",
        promptText: "glad dad had a glass flask and half a salad shall fall",
        fingerGuide: "Breathe steadily and keep shoulders relaxed"
      }
    ]
  },

  // ================= TOP ROW (Levels 4 - 6) =================
  {
    id: "lesson-top-1",
    category: "Top Row",
    title: "Top Row Reaches (E I R U)",
    level: 4,
    description: "Learn high-frequency vowels E and I along with R and U on the upper QWERTY row.",
    targetKeys: ["e", "i", "r", "u"],
    steps: [
      {
        id: "step-1",
        title: "Vowels E and I",
        targetKeys: ["e", "i"],
        description: "Left middle reaches up to E, right middle reaches up to I.",
        promptText: "de ki de ki side hide ride life idea file like",
        fingerGuide: "Left Middle up to E | Right Middle up to I"
      },
      {
        id: "step-2",
        title: "Index Reaches R and U",
        targetKeys: ["r", "u"],
        description: "Left index reaches up to R, right index reaches up to U.",
        promptText: "fr ju fr ju fire rush rude fur sure pure rare",
        fingerGuide: "Left Index up to R | Right Index up to U"
      },
      {
        id: "step-3",
        title: "Top Row Drill 1",
        targetKeys: ["e", "i", "r", "u"],
        description: "Practice combining E, I, R, and U with home row keys.",
        promptText: "there issue figure rule user rider desire failure",
        fingerGuide: "Smooth reach up and return"
      }
    ]
  },
  {
    id: "lesson-top-2",
    category: "Top Row",
    title: "Full Top Row (Q W T Y O P)",
    level: 5,
    description: "Expand your range to all upper keys including W, T, O, P, Q, and Y.",
    targetKeys: ["q", "w", "t", "y", "o", "p"],
    steps: [
      {
        id: "step-1",
        title: "W, T, O, P Reaches",
        targetKeys: ["w", "t", "o", "p"],
        description: "W (left ring), T (left index extension), O (right ring), P (right pinky).",
        promptText: "sw ft lo fp wet top pot tow power point write",
        fingerGuide: "Ring & Pinky reaches to top row"
      },
      {
        id: "step-2",
        title: "Rare Reaches Q and Y",
        targetKeys: ["q", "y"],
        description: "Q (left pinky reach), Y (right index stretch).",
        promptText: "aq hy aq hy quiet quality yellow symmetry quote equip",
        fingerGuide: "Left Pinky up to Q | Right Index stretch to Y"
      },
      {
        id: "step-3",
        title: "Top & Home Combo",
        targetKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        description: "Type fluent top row words.",
        promptText: "quick typewriter poetry request property superiority",
        fingerGuide: "Maintain posture without resting wrists heavily"
      }
    ]
  },
  {
    id: "lesson-top-3",
    category: "Top Row",
    title: "Top & Home Row Fluidity",
    level: 6,
    description: "Achieve seamless vertical transitions between home row anchors and the upper row.",
    targetKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    steps: [
      {
        id: "step-1",
        title: "Vertical Row Oscillations",
        targetKeys: ["e", "d", "r", "f", "u", "j", "i", "k"],
        description: "Rapidly bounce between home anchors and top keys.",
        promptText: "ed rf uj ik tg yh weed feed tree roof wide road",
        fingerGuide: "Curved fingers move effortlessly like playing piano"
      },
      {
        id: "step-2",
        title: "Multi-Row Vocabulary",
        targetKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        description: "Full vocabulary requiring both upper and middle rows.",
        promptText: "people report their great power through high quality work",
        fingerGuide: "Keep movements compact and close to keycaps"
      },
      {
        id: "step-3",
        title: "Top-Home Speed Sprint",
        targetKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        description: "Fluent speed typing combining all home and top row keys.",
        promptText: "they were eager to equip their team with superior tools today",
        fingerGuide: "Continuous forward momentum with steady pacing"
      }
    ]
  },

  // ================= BOTTOM ROW (Levels 7 - 9) =================
  {
    id: "lesson-bottom-1",
    category: "Bottom Row",
    title: "Bottom Row Foundations (C V N M)",
    level: 7,
    description: "Master downward reaches to C and V with the left hand, and N and M with the right hand.",
    targetKeys: ["c", "v", "n", "m"],
    steps: [
      {
        id: "step-1",
        title: "C and V Reaches",
        targetKeys: ["c", "v"],
        description: "Left middle reaches down to C, left index reaches down to V.",
        promptText: "dc fv dc fv cave voice cover victory active ocean",
        fingerGuide: "Left Middle down to C | Left Index down to V"
      },
      {
        id: "step-2",
        title: "N and M Reaches",
        targetKeys: ["n", "m"],
        description: "Right index reaches down to N and stretch down to M.",
        promptText: "jn jm jn jm name mind moon number human motion",
        fingerGuide: "Right Index down to N and M"
      },
      {
        id: "step-3",
        title: "Bottom Row Combo",
        targetKeys: ["c", "v", "n", "m"],
        description: "Type words blending bottom row keys.",
        promptText: "voice machine vacuum environment economic movement",
        fingerGuide: "Curved fingers help reaching down cleanly"
      }
    ]
  },
  {
    id: "lesson-bottom-2",
    category: "Bottom Row",
    title: "Full Bottom Row (Z X B , . /)",
    level: 8,
    description: "Complete all bottom row keys including Z, X, B and punctuation.",
    targetKeys: ["z", "x", "b", ",", ".", "/"],
    steps: [
      {
        id: "step-1",
        title: "Z, X, B Keys",
        targetKeys: ["z", "x", "b"],
        description: "Z (left pinky), X (left ring), B (left index stretch).",
        promptText: "az sx gb az sx zero exact box breeze expand cabin",
        fingerGuide: "Left Pinky -> Z, Left Ring -> X, Left Index -> B"
      },
      {
        id: "step-2",
        title: "Punctuation Marks (, . /)",
        targetKeys: [",", ".", "/"],
        description: "Comma (right middle), Period (right ring), Slash (right pinky).",
        promptText: "k, l. k, l. yes, it is. fast, smooth. look. go.",
        fingerGuide: "Right Middle -> Comma | Right Ring -> Period"
      },
      {
        id: "step-3",
        title: "All Letters & Punctuation",
        targetKeys: ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
        description: "Complete sentences with proper punctuation.",
        promptText: "the quick, clever brown fox jumps over a lazy, sleeping dog.",
        fingerGuide: "Seamless transitions across all three letter rows"
      }
    ]
  },
  {
    id: "lesson-bottom-3",
    category: "Bottom Row",
    title: "Three-Row Full Alphabet Flow",
    level: 9,
    description: "Master seamless transitions spanning all three letter rows with full-alphabet pangrams.",
    targetKeys: ["a-z", ",", "."],
    steps: [
      {
        id: "step-1",
        title: "Classic Fox Pangram",
        targetKeys: ["a-z"],
        description: "The timeless drill testing all 26 letters in English.",
        promptText: "the quick brown fox jumps over the lazy dog.",
        fingerGuide: "Hit every letter without looking down at the keyboard"
      },
      {
        id: "step-2",
        title: "Jugs & Box Pangram",
        targetKeys: ["a-z"],
        description: "Pangram focusing heavily on pinky and index extremities.",
        promptText: "pack my box with five dozen liquor jugs before noon.",
        fingerGuide: "Stay anchored on home row between long reaches"
      },
      {
        id: "step-3",
        title: "Sphinx Quartz Mastery",
        targetKeys: ["a-z", ",", "."],
        description: "Dense letter traversal across top, middle, and bottom rows.",
        promptText: "sphinx of black quartz, judge my vow with swift precision.",
        fingerGuide: "Breathe smoothly through every punctuation pause"
      }
    ]
  },

  // ================= CAPITALS & SHIFT (Levels 10 - 12) =================
  {
    id: "lesson-shift-1",
    category: "Capitals & Shift",
    title: "Shift Keys & Capitalization",
    level: 10,
    description: "Master the two-handed opposite shift technique for effortless capitalization.",
    targetKeys: ["Shift", "A-Z"],
    steps: [
      {
        id: "step-1",
        title: "Opposite Shift Technique",
        targetKeys: ["Shift"],
        description: "Hold Right Shift with right pinky when typing left-hand capitals (e.g. A, S, D, F).",
        promptText: "America Science Florida Denmark London Tokyo Paris Rome",
        fingerGuide: "Use opposite shift key to avoid awkward one-handed stretching!"
      },
      {
        id: "step-2",
        title: "Mixed Case Sentences",
        targetKeys: ["Shift"],
        description: "Practice capital letters at the start of sentences and proper nouns.",
        promptText: "John and Sarah visited New York in September. They loved Central Park.",
        fingerGuide: "Hold Shift firmly before pressing the target letter"
      },
      {
        id: "step-3",
        title: "Formal Capitalization Drill",
        targetKeys: ["Shift", "A-Z"],
        description: "Rapid capitals in institutional titles and acronyms.",
        promptText: "The United Nations General Assembly met in Geneva, Switzerland.",
        fingerGuide: "Release shift promptly after striking the capital letter"
      }
    ]
  },
  {
    id: "lesson-shift-2",
    category: "Capitals & Shift",
    title: "Quotes, Contractions & Marks",
    level: 11,
    description: "Practice apostrophes, quotation marks, exclamation marks, question marks, and hyphens.",
    targetKeys: ["'", "\"", "?", "!", "-", ":"],
    steps: [
      {
        id: "step-1",
        title: "Contractions & Apostrophes",
        targetKeys: ["'"],
        description: "Right pinky reaches apostrophe for natural contractions.",
        promptText: "don't can't wouldn't it's they're we've you'll o'clock",
        fingerGuide: "Right pinky reaches over to the apostrophe key"
      },
      {
        id: "step-2",
        title: "Dialogue & Quotations",
        targetKeys: ["\"", "!"],
        description: "Shift + apostrophe produces standard double quotes.",
        promptText: "\"Focus on rhythm,\" she advised; \"speed will follow naturally!\"",
        fingerGuide: "Left shift + right pinky for quotes"
      },
      {
        id: "step-3",
        title: "Questions & Hyphens",
        targetKeys: ["?", "!", "-"],
        description: "Expressive punctuation in modern English sentences.",
        promptText: "Have you tried state-of-the-art keyboard drills? Yes, absolutely!",
        fingerGuide: "Left shift + right pinky slash for question mark"
      }
    ]
  },
  {
    id: "lesson-shift-3",
    category: "Capitals & Shift",
    title: "Complex Prose & Dialogue Flow",
    level: 12,
    description: "Synthesize dialogue, sentence transitions, and expressive prose with zero hesitation.",
    targetKeys: ["Shift", "Punctuation", "Dialogue"],
    steps: [
      {
        id: "step-1",
        title: "Narrative Dialogue Sprint",
        targetKeys: ["\"", "!", "?"],
        description: "Rapid dialogue transitions in storytelling.",
        promptText: "\"Wait!\" cried Dr. Watson. \"Did you examine the mysterious lock?\"",
        fingerGuide: "Flow through quotes without pausing keyboard rhythm"
      },
      {
        id: "step-2",
        title: "Punctuation-Heavy Excerpt",
        targetKeys: [":", ";", "-", ","],
        description: "Complex sentence structure with colons and hyphens.",
        promptText: "Speed, accuracy, and ergonomic rhythm: these three form touch typing.",
        fingerGuide: "Keep fingers hovering naturally above home row"
      },
      {
        id: "step-3",
        title: "Literary Speed Drill",
        targetKeys: ["A-Z", "Punctuation"],
        description: "High-cadence classic literary passage.",
        promptText: "It was the best of times; it was the age of wisdom and invention.",
        fingerGuide: "Maintain relaxed posture and rhythmic keystrokes"
      }
    ]
  },

  // ================= NUMBERS & SYMBOLS (Levels 13 - 15) =================
  {
    id: "lesson-num-1",
    category: "Numbers & Symbols",
    title: "Left-Hand Numbers (1 2 3 4 5)",
    level: 13,
    description: "Train muscle memory for upward reach angles from home row to numbers 1 through 5.",
    targetKeys: ["1", "2", "3", "4", "5"],
    steps: [
      {
        id: "step-1",
        title: "Pinky, Ring & Middle (1, 2, 3)",
        targetKeys: ["1", "2", "3"],
        description: "Pinky reaches to 1, Ring reaches to 2, Middle reaches to 3.",
        promptText: "a1 s2 d3 a1 s2 d3 123 321 213 132 231 312 11 22 33",
        fingerGuide: "Reach diagonally up and return immediately to home row"
      },
      {
        id: "step-2",
        title: "Index Reaches (4 & 5)",
        targetKeys: ["4", "5"],
        description: "Left index reaches up to 4 and stretches over to 5.",
        promptText: "f4 f5 f4 f5 454 545 44 55 14 25 34 51 42 53 15 24",
        fingerGuide: "Left Index reaches up-right to 4 and 5"
      },
      {
        id: "step-3",
        title: "Quantities & Left Numbers",
        targetKeys: ["1", "2", "3", "4", "5"],
        description: "Natural phrases incorporating numbers 1 through 5.",
        promptText: "room 102 bus 45 flight 314 page 25 section 3 chapter 4",
        fingerGuide: "Don't look at the number row; feel the distance"
      }
    ]
  },
  {
    id: "lesson-num-2",
    category: "Numbers & Symbols",
    title: "Right-Hand Numbers (6 7 8 9 0)",
    level: 14,
    description: "Complete the number row with right-hand reaches to 6, 7, 8, 9, and 0 for dates and metrics.",
    targetKeys: ["6", "7", "8", "9", "0"],
    steps: [
      {
        id: "step-1",
        title: "Index Reaches (6 & 7)",
        targetKeys: ["6", "7"],
        description: "Right index stretches to 6 and reaches up to 7.",
        promptText: "j6 j7 j6 j7 676 767 66 77 76 67 1976 1967 760 670",
        fingerGuide: "Right Index stretches up-left to 6 and up to 7"
      },
      {
        id: "step-2",
        title: "Middle, Ring, Pinky (8, 9, 0)",
        targetKeys: ["8", "9", "0"],
        description: "Middle to 8, Ring to 9, Pinky to 0.",
        promptText: "k8 l9 ;0 890 098 88 99 00 1980 1999 2020 2026 800",
        fingerGuide: "Right Middle -> 8, Right Ring -> 9, Right Pinky -> 0"
      },
      {
        id: "step-3",
        title: "Full Number Row Drills",
        targetKeys: ["0-9"],
        description: "Dates, years, and statistical quantities.",
        promptText: "in 1984 there were 365 days; in 2026 we count 100 percent of 8760 hours.",
        fingerGuide: "Smooth transitions between words and digits"
      }
    ]
  },
  {
    id: "lesson-num-3",
    category: "Numbers & Symbols",
    title: "Essential Symbols (! @ # $ % & * = +)",
    level: 15,
    description: "Shift-reach combinations for currency, email addresses, math equations, and percentages.",
    targetKeys: ["!", "@", "#", "$", "%", "&", "*", "+", "="],
    steps: [
      {
        id: "step-1",
        title: "Currencies, Handles & Hashtags",
        targetKeys: ["$", "#", "@", "%"],
        description: "Standard internet and financial symbols.",
        promptText: "contact@keymaster.io costs $49.99 with #1 priority and 20% discount",
        fingerGuide: "Shift + number keys using opposite pinky anchor"
      },
      {
        id: "step-2",
        title: "Math Equations & Operators",
        targetKeys: ["+", "=", "*", "-"],
        description: "Basic arithmetic and logic expressions.",
        promptText: "total = 100 + 50 * 2; if (x == y && a != b) score += 10;",
        fingerGuide: "Maintain accurate shift holds for math operators"
      },
      {
        id: "step-3",
        title: "Combined Financial Drill",
        targetKeys: ["$", "%", "@", "=", "+", "!"],
        description: "Invoice and technical summary drilling.",
        promptText: "invoice #8402: 5 items @ $19.95 = $99.75 + 8.5% tax = $108.23 total!",
        fingerGuide: "Confidence on the top symbol row unlocks true pro speed"
      }
    ]
  },

  // ================= MASTERY DRILLS (Levels 16 - 18) =================
  {
    id: "lesson-code-1",
    category: "Mastery Drills",
    title: "Developer Syntax & Brackets",
    level: 16,
    description: "Type code with lightning speed: braces { }, brackets [ ], angle tags < >, and arrows =>.",
    targetKeys: ["{", "}", "[", "]", "<", ">", ";", "=>", "()"],
    steps: [
      {
        id: "step-1",
        title: "Brackets, Braces & Parentheses",
        targetKeys: ["[", "]", "{", "}", "(", ")"],
        description: "Essential enclosure characters in programming.",
        promptText: "items[0] = { id: 1, label: \"alpha\" }; list.map((x) => x * 2);",
        fingerGuide: "Right pinky reaches for [ ] and Shift for { }"
      },
      {
        id: "step-2",
        title: "Conditional Statements & Logic",
        targetKeys: ["&&", "||", "<", ">", ";"],
        description: "Boolean logic statements and HTML JSX tags.",
        promptText: "if (score >= 90 && active) { return <Badge status=\"ok\" />; }",
        fingerGuide: "Shift + comma/period for < and >"
      },
      {
        id: "step-3",
        title: "Full TypeScript Function",
        targetKeys: ["=>", ":", "{", "}", ";"],
        description: "Type complete arrow function signature without looking down.",
        promptText: "const calculateSpeed = (chars: number, sec: number): number => Math.round((chars / 5) / (sec / 60));",
        fingerGuide: "Fluid developer typing with punctuation and camelCase"
      }
    ]
  },
  {
    id: "lesson-code-2",
    category: "Mastery Drills",
    title: "High-Speed Trigraphs & Affixes",
    level: 17,
    description: "Program your subconscious reflexes for English's most common 3-letter clusters (ing, tion, ment, str).",
    targetKeys: ["ing", "tion", "ment", "ough", "str", "pro"],
    steps: [
      {
        id: "step-1",
        title: "Common Suffix Clusters",
        targetKeys: ["ing", "tion", "ment"],
        description: "Type whole letter clusters as single neural chunks.",
        promptText: "typing moving reaction action movement statement through thought",
        fingerGuide: "Roll fingers across ING and TION in one unified burst"
      },
      {
        id: "step-2",
        title: "Prefix & Root Bursts",
        targetKeys: ["pro", "str", "con", "pre"],
        description: "Pre-programmed muscle memory for root words.",
        promptText: "program protect produce strength structure construct complete",
        fingerGuide: "Group letters cognitively rather than letter-by-letter"
      },
      {
        id: "step-3",
        title: "Trigraph Flow Sentence",
        targetKeys: ["Trigraphs", "Clusters"],
        description: "High-velocity cluster typing across natural sentences.",
        promptText: "the fundamental components of programming require continuous training.",
        fingerGuide: "Feel the speed multiplier as your brain chunks prefixes and suffixes"
      }
    ]
  },
  {
    id: "lesson-code-3",
    category: "Mastery Drills",
    title: "Pro Speed Endurance (100+ WPM Target)",
    level: 18,
    description: "The ultimate touch typing challenge: zero pause, metronomic cadence, and high-speed stamina.",
    targetKeys: ["All Keys", "Endurance", "100+ WPM"],
    steps: [
      {
        id: "step-1",
        title: "Cadence Rhythm Warmup",
        targetKeys: ["Cadence"],
        description: "Strict metronomic consistency with zero micro-hesitations.",
        promptText: "keep a steady rhythm without hesitation across each keystroke.",
        fingerGuide: "Like playing a musical instrument, cadence creates speed"
      },
      {
        id: "step-2",
        title: "Cognitive Stamina Drill",
        targetKeys: ["All Keys"],
        description: "Maintain focus across a dense paragraph without looking down.",
        promptText: "master typists do not look at their hands; their fingers execute thought directly on the keyboard.",
        fingerGuide: "Keep hands light, float over the home row"
      },
      {
        id: "step-3",
        title: "Championship Sprint",
        targetKeys: ["Pro Mastery"],
        description: "The final touch typing graduation text.",
        promptText: "excellence is not an accidental event but the direct consequence of deliberate, persistent practice every single day.",
        fingerGuide: "Congratulations! You have completed the full Touch Typing Academy curriculum."
      }
    ]
  }
];
