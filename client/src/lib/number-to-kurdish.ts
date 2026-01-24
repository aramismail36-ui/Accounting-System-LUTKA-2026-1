const ones = [
  "", "یەک", "دوو", "سێ", "چوار", "پێنج", "شەش", "حەوت", "هەشت", "نۆ",
  "دە", "یازدە", "دوازدە", "سێزدە", "چواردە", "پازدە", "شازدە", "حەڤدە", "هەژدە", "نۆزدە"
];

const tens = [
  "", "", "بیست", "سی", "چل", "پەنجا", "شەست", "حەفتا", "هەشتا", "نەوەد"
];

const scales = [
  { value: 1_000_000_000_000, name: "تریلیۆن" },
  { value: 1_000_000_000, name: "ملیار" },
  { value: 1_000_000, name: "ملیۆن" },
  { value: 1_000, name: "هەزار" },
  { value: 100, name: "سەد" },
];

function convertHundreds(num: number): string {
  if (num === 0) return "";
  
  let result = "";
  
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    if (hundreds === 1) {
      result = "سەد";
    } else {
      result = ones[hundreds] + " سەد";
    }
    num %= 100;
    if (num > 0) result += " و ";
  }
  
  if (num >= 20) {
    const tensPart = Math.floor(num / 10);
    result += tens[tensPart];
    num %= 10;
    if (num > 0) result += " و " + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

export function numberToKurdish(num: number): string {
  if (num === 0) return "سفر";
  if (num < 0) return "ناتەواو " + numberToKurdish(Math.abs(num));
  
  let result = "";
  
  for (const scale of scales) {
    if (num >= scale.value) {
      const count = Math.floor(num / scale.value);
      if (scale.value === 100) {
        if (count === 1) {
          result += "سەد";
        } else {
          result += ones[count] + " سەد";
        }
      } else {
        result += convertHundreds(count) + " " + scale.name;
      }
      num %= scale.value;
      if (num > 0) result += " و ";
    }
  }
  
  if (num > 0) {
    if (num < 20) {
      result += ones[num];
    } else {
      result += convertHundreds(num);
    }
  }
  
  return result.trim();
}

export function formatAmountWithWords(amount: number): { number: string; words: string } {
  return {
    number: amount.toLocaleString() + " د.ع",
    words: numberToKurdish(amount) + " دینار"
  };
}
