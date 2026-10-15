// Measure of Faith, Set 1: Assurance of Salvation.
// Each card reads like a playing card: verse on the top half, prayer upside-down on the bottom half.
// Scripture is KJV. Prayers are Yv'e Bridges' own, from her handwritten cards.
const SET = "Assurance of Salvation";

const CARDS = [
  {
    label: "Measure of Faith",
    verse: "For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.",
    ref: "Romans 12:3",
    bottomLabel: "Measure of Faith",
    bottom: "God has dealt to every one of us a measure of faith. These cards are here to help yours grow, one verse and one prayer at a time.",
    small: true
  },
  {
    label: SET + " · Set 1",
    verse: "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life, and that ye may believe on the name of the Son of God.",
    ref: "1 John 5:13",
    prayer: "Father God, I thank You for Your promise in 1 John 5:13. I believe in Jesus Christ, the Son of God. I have eternal life!",
    small: true
  },
  {
    no: 1,
    verse: "For all have sinned, and come short of the glory of God.",
    verse2: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
    ref: "Romans 3:23", ref2: "Romans 6:23",
    prayer: "Father God, I thank You for forgiving me of my sin, and I receive Your gift of eternal life through Jesus Christ, who died to pay for my sin."
  },
  {
    no: 2,
    verse: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    ref: "John 3:16",
    prayer: "Father God, thank You for loving all of us so much that You gave us Jesus, and through faith in Him, eternal life!"
  },
  {
    no: 3,
    verse: "For whosoever shall call upon the name of the Lord shall be saved.",
    ref: "Romans 10:13",
    prayer: "Father God, I thank You that anyone who calls on the Lord Jesus shall be saved. Thank You for my salvation!"
  },
  {
    no: 4,
    verse: "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.",
    ref: "Acts 4:12",
    prayer: "Father God, I thank You for salvation in Christ Jesus our Lord. Thank You for my salvation!"
  },
  {
    no: 5,
    verse: "And he said unto them, Go ye into all the world, and preach the gospel to every creature. He that believeth and is baptized shall be saved.",
    ref: "Mark 16:15–16",
    prayer: "Thank You, Father God, for faith to believe, and for the privilege of being baptized and saved."
  },
  {
    label: "Set 1 · " + SET,
    list: ["1 John 5:13", "1 · Romans 3:23 & 6:23", "2 · John 3:16", "3 · Romans 10:13", "4 · Acts 4:12", "5 · Mark 16:15–16"],
    bottomLabel: "How to use these cards",
    bottom: "Read the verse out loud. Turn the card around and pray the prayer. Keep it with you, or give it to someone who needs it."
  }
];

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function cardHTML(c) {
  const label = c.label || (SET + " · " + c.no);
  let top;
  if (c.list) {
    top = `<ul class="list">${c.list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  } else {
    top = `<p class="verse">“${esc(c.verse)}”</p><p class="ref">${esc(c.ref)}</p>`;
    if (c.verse2) top += `<p class="verse">“${esc(c.verse2)}”</p><p class="ref">${esc(c.ref2)}</p>`;
  }
  const bottomLabel = c.bottomLabel || "Prayer";
  const bottom = c.prayer
    ? `<p class="prayer">${esc(c.prayer)}</p><p class="ref">${esc(c.ref2 ? c.ref + " & 6:23" : c.ref)}</p>`
    : `<p class="prayer">${esc(c.bottom)}</p><p class="ref">tpotdoc · Romans 12:3</p>`;
  return `<div class="card${c.small ? " small" : ""}">
    <div class="half top"><p class="label"><span class="blocks" aria-hidden="true"><i></i><i></i><i></i></span>${esc(label)}</p>${top}</div>
    <div class="mid" aria-hidden="true"><span>Measure of Faith</span></div>
    <div class="half bottom"><p class="label alt"><span class="blocks" aria-hidden="true"><i></i><i></i><i></i></span>${esc(bottomLabel)}</p>${bottom}</div>
  </div>`;
}

function renderCards(container, wrapEach) {
  container.innerHTML = CARDS.map(c => wrapEach ? wrapEach(cardHTML(c)) : cardHTML(c)).join("");
}
