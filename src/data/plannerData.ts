export interface DayReading {
  day: number;
  psalms: string;
  proverbs: string;
  newTestament: string;
}

export const plannerData: DayReading[] = [
  { day: 1, psalms: "Psalms/சங்கீதம் 01-04", proverbs: "Proverbs/நீதிமொழிகள் 01:01-19", newTestament: "Matthew/மத்தேயு 01-05" },
  { day: 2, psalms: "Psalms/சங்கீதம் 05-07", proverbs: "Proverbs/நீதிமொழிகள் 01:20-33", newTestament: "Matthew/மத்தேயு 06-09" },
  { day: 3, psalms: "Psalms/சங்கீதம் 08-09", proverbs: "Proverbs/நீதிமொழிகள் 02:01-15", newTestament: "Matthew/மத்தேயு 10-12" },
  { day: 4, psalms: "Psalms/சங்கீதம் 10-12", proverbs: "Proverbs/நீதிமொழிகள் 02:16 - 03:01-08", newTestament: "Matthew/மத்தேயு 13-14" },
  { day: 5, psalms: "Psalms/சங்கீதம் 13-16", proverbs: "Proverbs/நீதிமொழிகள் 03:09-26", newTestament: "Matthew/மத்தேயு 15-18" },
  // ... placeholders for remaining days
];

// Extrapolate for 70 days for demo purposes
for (let i = 6; i <= 70; i++) {
  plannerData.push({
    day: i,
    psalms: `Psalms/சங்கீதம் Day ${i}`,
    proverbs: `Proverbs/நீதிமொழிகள் Day ${i}`,
    newTestament: `NT Day ${i}`
  });
}
