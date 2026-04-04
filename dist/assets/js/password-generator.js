/**
 * JapanCalc — Secure Password Generator
 *
 * Security: Uses crypto.getRandomValues() — cryptographically secure PRNG.
 * Never uses Math.random() for password generation.
 * All generation happens client-side. Nothing sent to server.
 *
 * Entropy formula: E = log2(charset_size ^ length)
 * Strength thresholds:
 *   < 40 bits  → 弱い (Weak)
 *   40-59 bits → 普通 (Fair)
 *   60-79 bits → 強い (Strong)
 *   ≥ 80 bits  → 非常に強い (Very Strong)
 */

const CHARSETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghjkmnpqrstuvwxyz',
  numbers:   '23456789',
  symbols:   '!@#$%^&*()-_=+[]{}|;:,.<>?',
  uppercaseFull: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercaseFull: 'abcdefghijklmnopqrstuvwxyz',
  numbersFull:   '0123456789',
};

/**
 * Generate a single secure password
 * @param {Object} options
 * @param {number}  options.length         — 4-64
 * @param {boolean} options.uppercase
 * @param {boolean} options.lowercase
 * @param {boolean} options.numbers
 * @param {boolean} options.symbols
 * @param {boolean} options.excludeAmbiguous — exclude 0,O,1,l,I
 * @returns {{ password, entropy, strength, strengthLabel, strengthLabelEN, charsetSize, error }}
 */
export function generatePassword(options = {}) {
  const {
    length           = 16,
    uppercase        = true,
    lowercase        = true,
    numbers          = true,
    symbols          = false,
    excludeAmbiguous = true,
  } = options;

  if (length < 4 || length > 64)
    return { error: '長さは4〜64の間で指定してください', errorEN: 'Length must be between 4 and 64' };

  if (!uppercase && !lowercase && !numbers && !symbols)
    return { error: '少なくとも1種類の文字を選択してください', errorEN: 'Select at least one character type' };

  var charset = '';
  if (uppercase) charset += excludeAmbiguous ? CHARSETS.uppercase      : CHARSETS.uppercaseFull;
  if (lowercase) charset += excludeAmbiguous ? CHARSETS.lowercase      : CHARSETS.lowercaseFull;
  if (numbers)   charset += excludeAmbiguous ? CHARSETS.numbers        : CHARSETS.numbersFull;
  if (symbols)   charset += CHARSETS.symbols;

  var array    = new Uint32Array(length);
  crypto.getRandomValues(array);
  var password = Array.from(array)
    .map(function(n) { return charset[n % charset.length]; })
    .join('');

  // Ensure at least one char from each selected type
  var mandatory = [];
  if (uppercase) mandatory.push(getRandomChar(excludeAmbiguous ? CHARSETS.uppercase : CHARSETS.uppercaseFull));
  if (lowercase) mandatory.push(getRandomChar(excludeAmbiguous ? CHARSETS.lowercase : CHARSETS.lowercaseFull));
  if (numbers)   mandatory.push(getRandomChar(excludeAmbiguous ? CHARSETS.numbers   : CHARSETS.numbersFull));
  if (symbols)   mandatory.push(getRandomChar(CHARSETS.symbols));

  var pwArray = password.split('');
  mandatory.forEach(function(char) {
    var pos = getRandomInt(pwArray.length);
    pwArray[pos] = char;
  });
  var finalPassword = pwArray.join('');

  var entropy = Math.log2(Math.pow(charset.length, length));
  var str = calcStrength(entropy);

  return {
    password:       finalPassword,
    entropy:        Math.round(entropy),
    strength:       str.strength,
    strengthLabel:  str.strengthLabel,
    strengthLabelEN: str.strengthLabelEN,
    charsetSize:    charset.length,
    length:         length,
  };
}

/**
 * Generate multiple passwords at once
 * @param {number} count — 1-10
 * @param {Object} options — same as generatePassword
 * @returns {Array}
 */
export function generateMultiple(count, options) {
  count = Math.min(Math.max(1, count), 10);
  return Array.from({ length: count }, function() { return generatePassword(options); });
}

function getRandomChar(charset) {
  var arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

function getRandomInt(max) {
  var arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function calcStrength(entropy) {
  if (entropy < 40) return { strength: 1, strengthLabel: '弱い',       strengthLabelEN: 'Weak' };
  if (entropy < 60) return { strength: 2, strengthLabel: '普通',       strengthLabelEN: 'Fair' };
  if (entropy < 80) return { strength: 3, strengthLabel: '強い',       strengthLabelEN: 'Strong' };
                    return { strength: 4, strengthLabel: '非常に強い', strengthLabelEN: 'Very Strong' };
}
