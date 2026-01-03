// Real London postcodes
/*
const LONDON_POSTCODES = [
  "EC1A 1BB","EC1M 6BQ","EC1V 9LB","EC2A 4NE","EC2M 7QS","EC2R 8BT","EC3M 8AA","EC3N 4AB","EC4A 1AA","EC4M 7AA",
  "WC1E 6BT","WC1H 9JP","WC1N 3AX","WC2H 7LT","WC2N 5DX","WC2R 0DP","W1A 1AA","W1B 4BL","W1C 1AH","W1D 6PA",
  "E1 6AN","E1 8QS","E2 8AA","E3 5PX","E14 5AB","E14 9SH","N1 9GU","N1C 4BU","N5 1XR","N7 9PW",
  "N16 0EF","NW1 4NP","NW3 6LN","NW5 2HS","NW8 7QE","SE1 0AA","SE1 2AA","SE10 9HZ","SE11 5JH","SE15 5QB",
  "SE17 1BU","SE18 6HX","SW1A 0AA","SW1A 1AA","SW1E 6QP","SW1H 9EX","SW3 4UH","SW5 9QJ","SW6 4SJ","SW7 2AZ",
  "SW8 1RL","W1G 9PF","W2 4UW","W8 6BD","W9 2JP","WC2B 6SE","EC4Y 8RL","E1W 1BU","W1J 7NT","E3 4RU",
  "N4 1QL","E9 5EN","SE8 3GA","SE16 7DW","SE17 3TW","W6 8RF","W12 7RJ","W14 0EE","NW6 5QA","NW10 7RP",
  "SW16 2HN","SE27 9DY","E17 4QS","E5 9BQ","N2 8HH","N3 2PD","N15 3QX","NW1W 6YT","NW10 8EU","SW4 6QR",
  "W10 5NE","W11 2RH","W13 8RA","W3 8PN","WC1X 9AE","WC2A 3HP","EC3A 8AF","EC3R 8BA","EC4N 8AD","SW1P 1AX",
  "SE1P 5LX","SE9 1TB","SE22 0JB","SE23 3DG","SE24 0JU","SE26 5DN","SW15 1BN","W1K 1SH","W4 1RW","E1 7RU",
  "E2 0JE","E3 2QT","E7 8NE","E15 1AJ","E20 1JN","N1 7GU","N5 2UY","N7 8DB","N8 9DE","NW1 0QE",
  "NW2 7HT","NW8 6LQ","SE5 8AT","SW1V 1JT","SW3 5RX","SW6 1QA","W1T 3JL","W6 9JT","W9 1JE","WC1R 4PJ",
  "EC1R 4RB","WC2H 7DE","WC2R 2LS","E1 0AA","E2 8AA","E14 0LN","E14 9TE","E16 2AQ","N1 0UY","N10 3LD",
  "N6 5AH","NW1 3ER","NW3 5BP","SE1 9SG","SE8 4HL","SE10 8NB","SE13 7DP","SW1X 7XL","SW3 3HZ","SW19 4RQ",
  "W1S 1HD","W8 5TT","W10 6QA","WC1H 0LS","WC2E 7BT","EC2Y 5AS","EC4R 3TB","E1W 3RR","E5 8SD","E9 7AP",
  "N7 0DT","N16 8NH","NW1 5JL","NW2 2PT","NW5 3PD","NW8 9NE","SE1 4LF","SE11 6RR","SE19 3RS","SE23 2QF",
  "SW1E 5HX","SW1W 9RE","SW6 2TY","SW7 3HL","W1D 7DH","W11 1QE","W12 8PP","W2 5DJ","WC1V 7QE","WC2B 5LR",
  "EC1Y 8LX","E1 2AN","E2 7QL","E17 5NA","E20 1DA","N1 6HH","N4 3QD","NW1 2AA","NW3 7AD","SE1 6BD",
  "SE5 0UB","SE16 3TZ","SW1T 4JZ","SW3 6PQ","W1U 2RF","W8 4TE","W9 3AP","WC1E 7HB","WC2A 1PP","EC3V 9DF",
  "E14 3DN","E14 5QG","N1 8AA","N16 0PY","NW1 4AY","NW5 1SB","NW10 2JN","SE1 8XL","SE15 1JN","SW1A 2AA",
  "SW1E 6AU","SW6 3QQ","W1B 1AH","W6 0UG","WC2H 7BX","EC1M 5PW","E1 4QL","E2 6QA","E3 3HP","E3 5DP",
  "N1 7GU","N5 1NU","NW1 6XE","NW3 6HU","NW8 7NB","SE1 7QD","SE11 4BT","SE26 4HG","SW1W 9SU","W1C 2JL",
  "W8 6DW","WC1N 3LJ","EC4A 3LT","EC4M 8EB","E14 4LX","E14 8QS","N1 1TR","N4 2BE","NW1 5JB","NW5 2PB",
  "SE1 3BP","SE6 2PR","SE23 1HT","SW1P 3JA","W1G 8LZ","W10 4LG","WC1X 9EU","WC2R 1BT","EC3M 7AA","E1 3DZ",
  "E2 1BQ","E5 0SE","E15 2SE","N1 2AA","N10 1PY","NW2 4TP","NW8 8RH","SE1 2AE","SE15 3UX","SW1A 1QD",
  "SW3 2EF","W1H 5HF","W2 6AA","WC1R 0NP","WC2E 6JJ","EC1V 8QT","E1W 2SW","E14 2AN","N4 1AP","NW3 1HL",
  "SE1 1TD","SE9 2JL","SW1X 0AA","W1J 4QU","W6 7NF","WC1E 6HR","EC4N 7BP","E1 5DL","E3 1ET","N7 6QP",
  "N16 0RQ","NW1 6AB","NW5 3HA","SE1 0NY","SE15 2EH","SW6 1LR","W1T 1AJ","W2 2UH","WC2B 6EX","EC3A 7DP",
    "BR1 1AA", "BR2 9EF", "BR3 3NH", "BR5 1AJ", "BR6 0RL", "BR7 5AB",
  "CR0 1AA", "CR2 6AQ", "CR4 7AL", "CR7 8BD", "CR8 2BN", "CR9 1AT",
  "DA1 4AL", "DA5 1AA", "DA6 7AY", "DA14 4AS", "DA15 7DW", "DA16 1BW",
  "E4 6AG", "E6 1AA", "E10 5HH", "E11 1AA", "E12 5DB", "E17 3AA", "E18 1AA",
  "EN1 1AA", "EN2 6AA", "EN3 4AA", "EN4 8AA", "EN5 1AA",
  "HA0 1AA", "HA1 1AA", "HA2 0AA", "HA3 5AA", "HA5 1AA", "HA8 0AA", "HA9 0AA",
  "IG1 1AA", "IG2 6AA", "IG3 8AA", "IG6 1AA", "IG8 0AA", "IG11 7AA",
  "KT1 1AA", "KT2 5AA", "KT3 3AA", "KT4 7AA", "KT6 4AA", "KT9 1AA",
  "N3 1AA", "N9 0AA", "N11 1AA", "N12 0AA", "N13 4AA", "N14 5AA", "N20 0AA", "N21 1AA",
  "NW2 1AA", "NW4 1AA", "NW7 1AA", "NW9 0AA", "NW10 1AA",
  "RM1 1AA", "RM2 5AA", "RM3 0AA", "RM6 4AA", "RM8 1AA", "RM11 1AA", "RM12 4AA",
  "SE2 0AA", "SE3 0AA", "SE6 1AA", "SE9 1AA", "SE12 0AA", "SE18 1AA", "SE20 7AA", "SE25 4AA",
  "SM1 1AA", "SM2 5AA", "SM3 8AA", "SM4 4AA", "SM5 1AA", "SM6 0AA",
  "SW14 7AA", "SW15 1AA", "SW16 1AA", "SW17 0AA", "SW19 1AA", "SW20 0AA",
  "TW1 1AA", "TW3 1AA", "TW5 0AA", "TW7 4AA", "TW9 1AA", "TW13 4AA",
  "UB1 1AA", "UB2 4AA", "UB3 1AA", "UB5 4AA", "UB6 0AA", "UB8 1AA", "UB10 0AA",
  "W3 0AA", "W4 1AA", "W5 1AA", "W7 1AA", "W13 0AA",

  // Enfield / Barnet (EN, N outer)
  "EN1 1AA","EN1 2JP","EN2 6RT","EN3 5HX","EN4 8QF","EN5 4DL","EN6 1AB","EN7 6QR",
  "N11 1QG","N11 2AB","N12 0JP","N13 4RD","N14 6QA","N20 9DB",

  // Harrow / Brent / Wembley (HA)
  "HA0 1AA","HA0 4TX","HA1 1BQ","HA1 4FH","HA2 6AB","HA2 9RS","HA3 5UX","HA3 8NP",
  "HA4 0DR","HA4 9QD","HA5 1RF","HA5 3LL","HA6 1NW","HA6 2YY",

  // Hillingdon / Uxbridge / Hayes (UB)
  "UB1 1AF","UB2 3QP","UB3 4AZ","UB4 8RN","UB5 6HJ","UB6 0FD","UB7 9DP",
  "UB8 1QS","UB9 6AD","UB10 0XY","UB11 1AA",

  // Ealing / West London outer (W)
  "W3 7AB","W4 5RP","W5 3HT","W7 2AJ","W13 0DH",

  // Hounslow / Twickenham (TW)
  "TW1 1AE","TW1 4HF","TW2 5NB","TW3 3AT","TW4 6QS","TW5 0PL","TW7 7DX",
  "TW8 9DF","TW9 1UJ","TW10 5NG","TW11 9LR","TW12 2AB","TW13 6RT","TW14 0QA",

  // Kingston / Surbiton (KT)
  "KT1 1AA","KT1 3JP","KT2 5TN","KT3 6RF","KT4 8BQ","KT5 9LP","KT6 4DN",
  "KT7 0XH","KT8 1QS","KT9 2AB",

  // Bromley / Orpington (BR)
  "BR1 1AB","BR1 3JP","BR2 0AA","BR3 4HQ","BR4 9DX","BR5 1LL",
  "BR6 7QS","BR7 5NP","BR8 8QA",

  // Croydon (CR)
  "CR0 1AA","CR0 4AB","CR2 6JP","CR3 5TN","CR4 1XG",
  "CR5 2AD","CR6 9PL","CR7 8HX","CR8 3QS","CR9 2AJ",

  // Bexley / Dartford (DA)
  "DA1 1AA","DA2 6JP","DA3 7TN","DA4 9QS","DA5 1AB",
  "DA6 8HQ","DA7 5RF","DA8 3LL","DA9 9DX",

  // Havering / Romford (RM)
  "RM1 1AA","RM1 4JP","RM2 5TN","RM3 8AB","RM4 1QS",
  "RM5 3DX","RM6 6HQ","RM7 9RF","RM8 2LL","RM9 5NP",
  "RM10 7AB","RM11 3JP","RM12 4TN","RM13 8QS","RM14 1DX",

  // Redbridge / Ilford (IG)
  "IG1 1AA","IG1 4JP","IG2 6TN","IG3 8AB","IG4 5QS",
  "IG5 0DX","IG6 2HQ","IG7 9RF","IG8 1LL","IG9 6NP",

  // Outer East London (E)
  "E4 6AA","E6 1JP","E7 0TN","E10 5AB","E11 3QS",
  "E12 6DX","E13 9HQ","E15 2RF","E17 1LL","E18 5NP",

  // Outer South East London (SE)
  "SE2 0AA","SE3 9JP","SE6 4TN","SE7 8AB","SE9 1QS",
  "SE12 0DX","SE13 6HQ","SE18 2RF","SE19 1LL","SE20 7NP",

  // Outer South West London (SW)
  "SW12 9AA","SW13 0JP","SW15 3TN","SW16 6AB",
  "SW17 8QS","SW18 4DX","SW19 1HQ","SW20 9RF"
];
*/

const LONDON_POSTCODES = [
"WC2H 7BX","EC1M 5PW","E1 4QL","E2 6QA","E3 3HP","E3 5DP",
  "N1 7GU","N5 1NU","NW1 6XE","NW3 6HU","NW8 7NB","SE1 7QD","SE11 4BT","SE26 4HG","SW1W 9SU","W1C 2JL",
  "W8 6DW","WC1N 3LJ","EC4A 3LT","EC4M 8EB","E14 4LX","E14 8QS","N1 1TR","N4 2BE","NW1 5JB","NW5 2PB",
  "SE1 3BP","SE6 2PR","SE23 1HT","SW1P 3JA","W1G 8LZ","W10 4LG","WC1X 9EU","WC2R 1BT","EC3M 7AA","E1 3DZ",
  "E2 1BQ","E5 0SE","E15 2SE","N1 2AA","N10 1PY","NW2 4TP","NW8 8RH","SE1 2AE","SE15 3UX","SW1A 1QD",
  "SW3 2EF","W1H 5HF","W2 6AA","WC1R 0NP","WC2E 6JJ","EC1V 8QT","E1W 2SW","E14 2AN","N4 1AP","NW3 1HL",
  "SE1 1TD","SE9 2JL","SW1X 0AA","W1J 4QU","W6 7NF","WC1E 6HR","EC4N 7BP","E1 5DL","E3 1ET","N7 6QP",
  "N16 0RQ","NW1 6AB","NW5 3HA","SE1 0NY","SE15 2EH","SW6 1LR","W1T 1AJ","W2 2UH","WC2B 6EX","EC3A 7DP",
    "BR1 1AA", "BR2 9EF", "BR3 3NH", "BR5 1AJ", "BR6 0RL", "BR7 5AB",
  "CR0 1AA", "CR2 6AQ", "CR4 7AL", "CR7 8BD", "CR8 2BN", "CR9 1AT",
  "DA1 4AL", "DA5 1AA", "DA6 7AY", "DA14 4AS", "DA15 7DW", "DA16 1BW",
  "E4 6AG", "E6 1AA", "E10 5HH", "E11 1AA", "E12 5DB", "E17 3AA", "E18 1AA",
  "EN1 1AA", "EN2 6AA", "EN3 4AA", "EN4 8AA", "EN5 1AA",
  "HA0 1AA", "HA1 1AA", "HA2 0AA", "HA3 5AA", "HA5 1AA", "HA8 0AA", "HA9 0AA",
  "IG1 1AA", "IG2 6AA", "IG3 8AA", "IG6 1AA", "IG8 0AA", "IG11 7AA",
  "KT1 1AA", "KT2 5AA", "KT3 3AA", "KT4 7AA", "KT6 4AA", "KT9 1AA",
  "N3 1AA", "N9 0AA", "N11 1AA", "N12 0AA", "N13 4AA", "N14 5AA", "N20 0AA", "N21 1AA",
  "NW2 1AA", "NW4 1AA", "NW7 1AA", "NW9 0AA", "NW10 1AA",
  "RM1 1AA", "RM2 5AA", "RM3 0AA", "RM6 4AA", "RM8 1AA", "RM11 1AA", "RM12 4AA",
  "SE2 0AA", "SE3 0AA", "SE6 1AA", "SE9 1AA", "SE12 0AA", "SE18 1AA", "SE20 7AA", "SE25 4AA",
  "SM1 1AA", "SM2 5AA", "SM3 8AA", "SM4 4AA", "SM5 1AA", "SM6 0AA",
  "SW14 7AA", "SW15 1AA", "SW16 1AA", "SW17 0AA", "SW19 1AA", "SW20 0AA",
  "TW1 1AA", "TW3 1AA", "TW5 0AA", "TW7 4AA", "TW9 1AA", "TW13 4AA",
  "UB1 1AA", "UB2 4AA", "UB3 1AA", "UB5 4AA", "UB6 0AA", "UB8 1AA", "UB10 0AA",
  "W3 0AA", "W4 1AA", "W5 1AA", "W7 1AA", "W13 0AA",

  // Enfield / Barnet (EN, N outer)
  "EN1 1AA","EN1 2JP","EN2 6RT","EN3 5HX","EN4 8QF","EN5 4DL","EN6 1AB","EN7 6QR",
  "N11 1QG","N11 2AB","N12 0JP","N13 4RD","N14 6QA","N20 9DB",

  // Harrow / Brent / Wembley (HA)
  "HA0 1AA","HA0 4TX","HA1 1BQ","HA1 4FH","HA2 6AB","HA2 9RS","HA3 5UX","HA3 8NP",
  "HA4 0DR","HA4 9QD","HA5 1RF","HA5 3LL","HA6 1NW","HA6 2YY",

  // Hillingdon / Uxbridge / Hayes (UB)
  "UB1 1AF","UB2 3QP","UB3 4AZ","UB4 8RN","UB5 6HJ","UB6 0FD","UB7 9DP",
  "UB8 1QS","UB9 6AD","UB10 0XY","UB11 1AA",

  // Ealing / West London outer (W)
  "W3 7AB","W4 5RP","W5 3HT","W7 2AJ","W13 0DH",

  // Hounslow / Twickenham (TW)
  "TW1 1AE","TW1 4HF","TW2 5NB","TW3 3AT","TW4 6QS","TW5 0PL","TW7 7DX",
  "TW8 9DF","TW9 1UJ","TW10 5NG","TW11 9LR","TW12 2AB","TW13 6RT","TW14 0QA",

  // Kingston / Surbiton (KT)
  "KT1 1AA","KT1 3JP","KT2 5TN","KT3 6RF","KT4 8BQ","KT5 9LP","KT6 4DN",
  "KT7 0XH","KT8 1QS","KT9 2AB",

  // Bromley / Orpington (BR)
  "BR1 1AB","BR1 3JP","BR2 0AA","BR3 4HQ","BR4 9DX","BR5 1LL",
  "BR6 7QS","BR7 5NP","BR8 8QA",

  // Croydon (CR)
  "CR0 1AA","CR0 4AB","CR2 6JP","CR3 5TN","CR4 1XG",
  "CR5 2AD","CR6 9PL","CR7 8HX","CR8 3QS","CR9 2AJ",

  // Bexley / Dartford (DA)
  "DA1 1AA","DA2 6JP","DA3 7TN","DA4 9QS","DA5 1AB",
  "DA6 8HQ","DA7 5RF","DA8 3LL","DA9 9DX",

  // Havering / Romford (RM)
  "RM1 1AA","RM1 4JP","RM2 5TN","RM3 8AB","RM4 1QS",
  "RM5 3DX","RM6 6HQ","RM7 9RF","RM8 2LL","RM9 5NP",
  "RM10 7AB","RM11 3JP","RM12 4TN","RM13 8QS","RM14 1DX",

  // Redbridge / Ilford (IG)
  "IG1 1AA","IG1 4JP","IG2 6TN","IG3 8AB","IG4 5QS",
  "IG5 0DX","IG6 2HQ","IG7 9RF","IG8 1LL","IG9 6NP",

  // Outer East London (E)
  "E4 6AA","E6 1JP","E7 0TN","E10 5AB","E11 3QS",
  "E12 6DX","E13 9HQ","E15 2RF","E17 1LL","E18 5NP",

  // Outer South East London (SE)
  "SE2 0AA","SE3 9JP","SE6 4TN","SE7 8AB","SE9 1QS",
  "SE12 0DX","SE13 6HQ","SE18 2RF","SE19 1LL","SE20 7NP",

  // Outer South West London (SW)
  "SW12 9AA","SW13 0JP","SW15 3TN","SW16 6AB",
  "SW17 8QS","SW18 4DX","SW19 1HQ","SW20 9RF"
];

export interface PostcodeCase {
  postcode: string;
}

/**
 * Randomly select unique postcodes from the real London postcodes array
 * Each postcode will only be used once (no duplicates)
 */
export const generateMultiplePostcodes = (count: number): PostcodeCase[] => {
  if (count > LONDON_POSTCODES.length) {
    console.warn(`⚠️  Requested ${count} postcodes but only ${LONDON_POSTCODES.length} unique postcodes available. Will use all available.`);
    count = LONDON_POSTCODES.length;
  }
  
  // Create a copy of the postcodes array and shuffle it
  const shuffledPostcodes = [...LONDON_POSTCODES];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffledPostcodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPostcodes[i], shuffledPostcodes[j]] = [shuffledPostcodes[j], shuffledPostcodes[i]];
  }
  
  // Take the first 'count' postcodes (all unique)
  return shuffledPostcodes.slice(0, count).map(postcode => ({ postcode }));
};

/**
 * Get a random postcode for agent locations
 */
export const getRandomPostcode = (): string => {
  const randomIndex = Math.floor(Math.random() * LONDON_POSTCODES.length);
  return LONDON_POSTCODES[randomIndex];
};

/**
 * Convert time string (e.g., "09:00") to seconds since midnight
 */
export const timeToSeconds = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60;
};

/**
 * Get time window for 9am-5pm shift
 */
export const getShiftTimeWindow = () => {
  return {
    startTime: { seconds: timeToSeconds('09:00') },
    endTime: { seconds: timeToSeconds('17:00') },
  };
};

/**
 * Get lunch break constraint (45 minutes)
 */
export const getLunchBreakConstraint = () => {
  return {
    startTime: { seconds: timeToSeconds('12:00') },
    duration: { seconds: 45 * 60 }, // 45 minutes
  };
};