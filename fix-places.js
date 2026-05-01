const fs = require('fs');
const filePath = '/home/dg6497/projects/GoDZ/src/app/services/places.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// ─── Corrections noms Tizi Ouzou (non-côtiers) ──────────────────────────────
const tizFixes = [
  // n05 : Larbaâ Nath Irathen → lac inland
  ['Plage de Larbaâ Nath Irathen', 'Lac de Larbaâ Nath Irathen'],
  ['شاطئ أربعاء ناث إيراثن',       'بحيرة أربعاء ناث إيراثن'],
  ['Larbaâ Nath Irathen Lake',     'Lac de Larbaâ Nath Irathen'],

  // n06 : Oued Aissi → rivière
  ['Plage de Oued Aissi',   'Oued Aissi'],
  ['شاطئ واد عيسي',         'نهر واد عيسي'],
  ['Oued Aissi River Beach', 'Oued Aissi'],

  // n07 : Djurdjura Lac → lac
  ['Plage de Djurdjura Lac', 'Lac du Djurdjura'],
  // nameAr et nameEn déjà corrects (بحيرة الجرجرة / Djurdjura Lake)

  // n10 : Ait Yahia Moussa → rivière
  ['Plage de Ait Yahia Moussa',   'Rivière Aït Yahia Moussa'],
  ['شاطئ آث يحيى موسى',           'نهر آث يحيى موسى'],
  ['Ait Yahia Moussa Beach',      'Rivière Aït Yahia Moussa'],

  // n11 : Oued Boubhir → rivière
  ['Plage de Oued Boubhir',  'Oued Boubhir'],
  ['شاطئ واد بوبهير',         'واد بوبهير'],
  ['Oued Boubhir Beach',     'Oued Boubhir'],

  // n13 : Aghribs → oued
  ['Plage de Aghribs',  'Oued d\'Aghribs'],
  ['شاطئ أغريب',         'واد أغريب'],
  ['Aghribs Beach',     'Oued d\'Aghribs'],

  // n14 : Beni Zmenzer Lac → lac (nameAr/nameEn déjà corrects)
  ['Plage de Beni Zmenzer Lac', 'Lac de Beni Zmenzer'],

  // n15 : Oued Tizi → oued
  ['Plage de Oued Tizi',   'Oued de Tizi Ouzou'],
  ['شاطئ واد تيزي',         'واد تيزي وزو'],
  ['Oued Tizi Beach',      'Oued de Tizi Ouzou'],

  // n16 : Fréha Rivière
  ['Plage de Fréha Rivière',  'Rivière de Fréha'],
  ['شاطئ نهر فريحة',            'نهر فريحة'],
  ['Fréha River Beach',       'Rivière de Fréha'],

  // n18 : Bouzeguene → lac
  ['Plage de Bouzeguene',  'Lac de Bouzeguene'],
  ['شاطئ بوزقن',             'بحيرة بوزقن'],
  ['Bouzeguene Beach',     'Lac de Bouzeguene'],

  // n19 : Zekri Rivière
  ['Plage de Zekri Rivière',  'Rivière Zekri'],
  ['شاطئ نهر زكري',             'نهر زكري'],
  ['Zekri River Beach',       'Rivière Zekri'],

  // n20 : Illilten Lac (nameAr/nameEn déjà corrects)
  ['Plage de Illilten Lac', 'Lac d\'Illilten'],
];

// ─── Corrections noms Tlemcen (non-côtiers) ─────────────────────────────────
const tlemFixes = [
  // n05 : Oued Mouilah → rivière
  ['Plage de Oued Mouilah',   'Oued Mouilah'],
  ['شاطئ واد المويلح',         'واد المويلح'],
  ['Oued Mouilah River',      'Oued Mouilah'],

  // n06 : Tafna Rivière
  ['Plage de Tafna Rivière',  'Rivière Tafna'],
  ['شاطئ نهر تافنة',            'نهر تافنة'],
  ['Tafna River Beach',       'Rivière Tafna'],

  // n09 : Sidi Ali Benyoub → source
  ['Plage de Sidi Ali Benyoub',   'Source de Sidi Ali Benyoub'],
  ['شاطئ سيدي علي بن يوب',         'عين سيدي علي بن يوب'],
  ['Sidi Ali Benyoub Beach',      'Source de Sidi Ali Benyoub'],

  // n10 : Remchi Rivière
  ['Plage de Remchi Rivière',  'Rivière de Remchi'],
  ['شاطئ نهر رمشي',              'نهر رمشي'],
  ['Remchi River Beach',       'Rivière de Remchi'],

  // n12 : Ain Youcef → source
  ['Plage de Ain Youcef',   'Source d\'Ain Youcef'],
  ['شاطئ عين يوسف',           'عين يوسف'],
  ['Ain Youcef Beach',      'Source d\'Ain Youcef'],

  // n14 : Nedroma Rivière
  ['Plage de Nedroma Rivière',  'Rivière de Nedroma'],
  ['شاطئ نهر ندرومة',             'نهر ندرومة'],
  ['Nedroma River Beach',       'Rivière de Nedroma'],

  // n18 : Maghnia Barrage → barrage/lac
  ['Plage de Maghnia Barrage',  'Barrage de Maghnia'],
  ['شاطئ سد مغنية',               'سد مغنية'],
  ['Maghnia Dam Beach',         'Barrage de Maghnia'],
];

let fixes = 0;
[...tizFixes, ...tlemFixes].forEach(([from, to]) => {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    fixes++;
    console.log(`✓ "${from}" → "${to}"`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n${fixes} corrections appliquées.`);
