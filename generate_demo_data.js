const fs = require('fs');

const SURNAMES = ['Abiola', 'Balogun', 'Chukwu', 'Daramola', 'Eze', 'Fashola', 'Garba', 'Hassan', 'Ibrahim', 'Jimoh', 'Kayode', 'Lawal', 'Musa', 'Nwankwo', 'Okonkwo', 'Patrick', 'Quadri', 'Rasaki', 'Suleiman', 'Taiwo', 'Udo', 'Vanguard', 'Wali', 'Xavier', 'Yakubu', 'Zubairu'];
const FIRST_NAMES = ['Adebayo', 'Blessing', 'Chinedu', 'Daniel', 'Esther', 'Folashade', 'Grace', 'Habib', 'Ifeoma', 'Jide', 'Kemi', 'Latifat', 'Mohammed', 'Ngozi', 'Oluwaseun', 'Peace', 'Queen', 'Ruth', 'Samuel', 'Titilayo', 'Uche', 'Victor', 'Wale', 'Yinka', 'Zainab'];
const MIDDLE_NAMES = ['Adewale', 'Babatunde', 'Chukwuemeka', 'Damilola', 'Elizabeth', 'Femi', 'Ganiyat', 'Habibat', 'Ibrahim', 'Jacob', 'Kudirat', 'Michael', 'Nwachukwu', 'Oluwafemi', 'Patricia', 'Quadri', 'Rasheedat', 'Suliat', 'Temidayo', 'Uthman', 'Victoria', 'Wale', 'Yakubu', 'Zainab'];

// Exact LGA names from nigerianData.js
const STATES_LGAS = {
  'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'],
  'Adamawa': ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
  'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ubium', 'Nsit Ibum', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue Offong Oruko', 'Uyo'],
  'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas Gadau', "Jama'are", 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
  'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
  'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
  'Borno': ['Abadam', 'Askira Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
  'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
  'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
  'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
  'Edo': ['Akoko Edo', 'Egor', 'Esan Central', 'Esan North East', 'Esan South East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Orhionmwon', 'Oredo', 'Ovia North East', 'Ovia South West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun Ifelodun', 'Ise Orun', 'Moba', 'Oye'],
  'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'],
  'FCT': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abuja Municipal Area Council'],
  'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu Deba'],
  'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
  'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
  'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', "Jema'a", 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
  'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', "Mai'Adua", 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
  'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu Danko', 'Yauri', 'Zuru'],
  'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Igalamela Odolu', 'Ijumu', 'Kabba Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
  'Lagos': ['Agege', 'Ajeromi Ifelodun', 'Alimosho', 'Amuwo Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju Lekki', 'Ifako Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi Isolo', 'Shomolu', 'Surulere'],
  'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
  'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
  'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado Odo Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
  'Ondo': ['Akoko North East', 'Akoko North West', 'Akoko South East', 'Akoko South West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
  'Osun': ['Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesha East', 'Ilesha West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
  'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North East', 'Ibadan North West', 'Ibadan South East', 'Ibadan South West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
  'Plateau': ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'],
  'Rivers': ['Abua Odual', 'Ahoada East', 'Ahoada West', 'Akuku Toru', 'Andoni', 'Asari Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio Akpor', 'Ogba Egbema Ndoni', 'Ogu Bolo', 'Okrika', 'Omuma', 'Opobo Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
  'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
  'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
  'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi'],
};

const STATES = Object.keys(STATES_LGAS);

const DEPARTMENTS = ['Administration', 'Finance', 'Human Resources', 'IT', 'Operations', 'Marketing', 'Sales', 'Engineering', 'Legal', 'Procurement', 'Audit', 'Security', 'Medical', 'Transport', 'Agriculture', 'Education', 'Works', 'Housing', 'Environment', 'Water Resources'];
const RANKS = ['Director', 'Deputy Director', 'Assistant Director', 'Chief Officer', 'Senior Officer', 'Officer I', 'Officer II', 'Officer III', 'Clerk I', 'Clerk II', 'Driver', 'Messenger', 'Director General', 'Permanent Secretary', 'Under Secretary', 'Chief Principal Secretary', 'Principal Secretary', 'Senior Secretary', 'Secretary', 'Assistant Secretary'];
const CADRES = ['Senior Staff', 'Junior Staff', 'Management', 'Contract Staff', 'NYSC', 'Intern', 'Consultant'];
const APPOINTMENT_TYPES = ['Permanent', 'Contract', 'Secondment', 'Temporary', 'Probation', 'Secondment', 'Consultancy'];
const PFAS = ['Leadway Pensure', 'Stanbic IBTC Pension Managers', 'ARM Pension Managers', 'Access Pension Fund', 'AIICO Pension Managers', 'Cornerstone Pension Fund', 'Crusader Sterling Pension Fund', 'Fidelity Pension Managers', 'First Pension Custodian', 'FCMB Pension Fund', 'Guinea Trust Pension Fund', 'Heritage Pension Fund'];
const STATUSES = ['Active', 'Active', 'Active', 'Active', 'Active', 'On Leave', 'Suspended', 'Retired', 'Dismissed'];
const SALARY_STRUCTURES = ['CONUSS', 'CONHESS', 'CONRAISS', 'CONMESS', 'CONTISS', 'CONPASS', 'CONJUSS', 'COS'];
const QUALIFICATIONS = ['SSCE', 'OND', 'HND', 'B.Sc', 'B.Tech', 'M.Sc', 'MBA', 'PhD', 'NCE', 'B.Ed', 'LLB', 'MBBS', 'B.Eng', 'B.Agric'];
const NATURE_OF_JOBS = ['Office Work', 'Field Work', 'Hybrid', 'Remote', 'Shift Work', 'Project Based', 'Teaching', 'Medical Practice', 'Engineering', 'Administrative'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getGeoPoliticalZone(state) {
  const zones = {
    'North Central': ['FCT', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'Benue'],
    'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
    'North West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
    'South East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
    'South South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
    'South West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo']
  };
  for (const [zone, states] of Object.entries(zones)) {
    if (states.includes(state)) return zone;
  }
  return 'Unknown';
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function randomDateBetween(minDate, maxDate) {
  const minTime = minDate.getTime();
  const maxTime = maxDate.getTime();
  const randomTime = minTime + Math.random() * (maxTime - minTime);
  return new Date(randomTime);
}

function generateEmployee(index) {
  const surname = randomItem(SURNAMES);
  const firstName = randomItem(FIRST_NAMES);
  const middleName = Math.random() > 0.3 ? randomItem(MIDDLE_NAMES) : '';
  const state = randomItem(STATES);
  const lgas = STATES_LGAS[state];
  const lga = randomItem(lgas);
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';

  // Generate DOB (1960-1990)
  const dobDate = new Date(randomInt(1960, 1990), randomInt(0, 11), randomInt(1, 28));

  // First Appointment: Must be after DOB + 18 years
  const minFirstApptDate = new Date(dobDate);
  minFirstApptDate.setFullYear(minFirstApptDate.getFullYear() + 18);
  // Ensure we don't go before 1980
  const minFirstAppt = new Date(Math.max(minFirstApptDate.getTime(), new Date(1980, 0, 1).getTime()));
  const maxFirstAppt = new Date(2020, 11, 31);
  const firstApptDate = randomDateBetween(minFirstAppt, maxFirstAppt);

  // Confirmation: Within 3 years of first appointment
  const minConfirmDate = new Date(firstApptDate);
  minConfirmDate.setDate(minConfirmDate.getDate() + 1);
  const maxConfirmDate = new Date(firstApptDate);
  maxConfirmDate.setFullYear(maxConfirmDate.getFullYear() + 3);
  maxConfirmDate.setDate(maxConfirmDate.getDate() - 1);
  const cappedMaxConfirm = new Date(Math.min(maxConfirmDate.getTime(), new Date(2024, 11, 31).getTime()));
  const confirmDate = randomDateBetween(minConfirmDate, cappedMaxConfirm);

  // Present Appointment: After first appointment, before or equal to 2024
  const minPresentAppt = new Date(firstApptDate);
  minPresentAppt.setDate(minPresentAppt.getDate() + 1);
  const maxPresentAppt = new Date(2024, 11, 31);
  const presentApptDate = randomDateBetween(minPresentAppt, maxPresentAppt);

  const department = randomItem(DEPARTMENTS);
  const rank = randomItem(RANKS);
  const cadre = randomItem(CADRES);
  const salaryGradeLevel = String(randomInt(1, 17));
  const step = String(randomInt(1, 15));
  const appointmentType = randomItem(APPOINTMENT_TYPES);
  const pfa = randomItem(PFAS);
  const rsaPin = Math.random() > 0.2 ? `RSA${randomInt(1000000000, 9999999999)}` : '';
  const status = randomItem(STATUSES);
  const salaryStructure = randomItem(SALARY_STRUCTURES);
  const qualification = randomItem(QUALIFICATIONS);
  const natureOfJob = randomItem(NATURE_OF_JOBS);
  const location = randomItem(['Headquarters', 'Zonal Office', 'Field Station', 'Remote', 'Branch Office']);
  const geopoliticalZone = getGeoPoliticalZone(state);
  const remark = Math.random() > 0.7 ? randomItem(['Promotion Due', 'Due for Training', 'Excellent Performer', 'Needs Improvement', 'On Study Leave', 'Suspended', '']) : '';

  const fileNumber = `TAN/${String(index + 1).padStart(4, '0')}/${randomInt(10, 99)}`;
  const ippis = Math.random() > 0.3 ? String(randomInt(100000, 999999)) : '';
  const psn = Math.random() > 0.5 ? `PSN/${randomInt(1000, 9999)}` : '';
  const phone = `0${randomItem([7, 8, 9])}${String(randomInt(10000000, 99999999))}`;
  const email = `${firstName.toLowerCase()}.${surname.toLowerCase()}@tani.com.ng`.replace(/\s/g, '');

  return {
    'File Number': fileNumber,
    'IPPIS': ippis,
    'PSN': psn,
    'Surname': surname,
    'First Name': firstName,
    'Middle Name': middleName,
    'Dob': formatDate(dobDate),
    'Sex': gender,
    'Phone': phone,
    'Department': department,
    'Cadre': cadre,
    'Rank': rank,
    'Salary Grade Level': salaryGradeLevel,
    'Step': step,
    'Type Of Appointment': appointmentType,
    'Date Of First Appointment': formatDate(firstApptDate),
    'Date Of Confirmation': formatDate(confirmDate),
    'Date Of Present Appointment': formatDate(presentApptDate),
    'PFA Name': pfa,
    'RSA Pin': rsaPin,
    'Email': email,
    'State': state,
    'LGA': lga,
    'Geo Political Zone': geopoliticalZone,
    'Remark': remark,
    'Status': status,
    'Location': location,
    'Age On Entry': String(randomInt(18, 45)),
    'Qualification': qualification,
    'Nature Of Job': natureOfJob,
    'Salary Structure': salaryStructure,
  };
}

function generateCSV(recordCount) {
  const headers = [
    'File Number', 'IPPIS', 'PSN', 'Surname', 'First Name', 'Middle Name',
    'Dob', 'Sex', 'Phone', 'Department', 'Cadre', 'Rank',
    'Salary Grade Level', 'Step', 'Type Of Appointment', 'Date Of First Appointment',
    'Date Of Confirmation', 'Date Of Present Appointment', 'PFA Name', 'RSA Pin',
    'Email', 'State', 'LGA', 'Geo Political Zone', 'Remark', 'Status',
    'Location', 'Age On Entry', 'Qualification', 'Nature Of Job', 'Salary Structure'
  ];

  const rows = [headers.join(',')];

  for (let i = 0; i < recordCount; i++) {
    const emp = generateEmployee(i);
    const values = headers.map(h => {
      let val = emp[h] || '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

const recordCount = 5431;
console.log(`Generating ${recordCount} demo records with guaranteed date order...`);
const csv = generateCSV(recordCount);
const outputPath = '/home/aminua/Documents/Tani Nigeria Ltd/TaniHR/tanihr/final_import_csv.csv';
fs.writeFileSync(outputPath, csv);
console.log(`Done! Generated ${recordCount} records and saved to: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
