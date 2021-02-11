export function getCountryName(country: string, toServerName = false): string {
  // map kaltura server country names to gep map county names
  const serveCountryNames = [
    'Aland Islands',
    'Antigua and Barbuda',
    'Bolivia, Plurinational State of',
    'Bosnia and Herzegovina',
    'British Indian Ocean Territory',
    'Brunei Darussalam',
    'Cayman Islands',
    'Central African Republic',
    'Czech Republic',
    'Dominican Republic',
    'Equatorial Guinea',
    'Falkland Islands (Malvinas)',
    'Faroe Islands',
    'French Polynesia',
    'French Southern Territories',
    'Heard Islans and Mcdonald Islands',
    'Iran, Islamic Republic of',
    'Korea, Democratic People\'s Republic of',
    'Korea, Republic of',
    'Lao People\'s Democratic Republic',
    'Libyan Arab Jamahiriya',
    'Macedonia, The Former Yugoslav Republic of',
    'Micronesia, Federated States of',
    'Moldova, Republic of',
    'Russian Federation',
    'Saint Pierre and Miquelon',
    'Saint Vincent and The Grenadines',
    'Sao Tome and Principe',
    'Serbia and Montenegro',
    'Solomon Islands',
    'Syrian Arab Republic',
    'Tanzania, United Republic of',
    'Turks and Caicos Islands',
    'Venezuela, Bolivarian Republic of',
    'Viet Nam'
  ];
  const mapCountryNames = [
    'Aland',
    'Antigua and Barb.',
    'Bolivia',
    'Bosnia and Herz.',
    'Br. Indian Ocean Ter.',
    'Brunei',
    'Cayman Is.',
    'Central African Rep.',
    'Czech Rep.',
    'Dominican Rep.',
    'Eq. Guinea',
    'Falkland Is.',
    'Faeroe Is.',
    'Fr. Polynesia',
    'Fr. S. Antarctic Lands',
    'Heard I. and McDonald Is.',
    'Iran',
    'Korea',
    'Korea',
    'Lao PDR',
    'Libya',
    'Macedonia',
    'Micronesia',
    'Moldova',
    'Russia',
    'St. Pierre and Miquelon',
    'St. Vin. and Gren.',
    'São Tomé and Principe',
    'Serbia',
    'Solomon Is.',
    'Syria',
    'Tanzania',
    'Turks and Caicos Is.',
    'Venezuela',
    'Vietnam'
  ];

  // if (toServerName) {
  //   const index = mapCountryNames.indexOf(country);
  //   return index === -1 ? country : serveCountryNames[index];
  // } else {
  //   const index = serveCountryNames.indexOf(country);
  //   return index === -1 ? country : mapCountryNames[index];
  // }
  return country;
}
