export interface LocationHierarchy {
  [district: string]: {
    [block: string]: {
      [panchayat: string]: string[]; // Array of villages
    };
  };
}

export const CASCADING_LOCATIONS: LocationHierarchy = {
  Patna: {
    Bihta: {
      Kanhauli: ['Sadisopur', 'Purhara', 'Raghopur', 'Bishunpura'],
      Anandpur: ['Katesar', 'Painathi', 'Daulatpur', 'Mahadeopur'],
      Kauria: ['Patepur', 'Bahuara', 'Taraura', 'Bikrampur'],
    },
    Danapur: {
      Ganghara: ['Usri', 'Hetanpur', 'Kasimchak', 'Chitnawan'],
      Mobarakpur: ['Sarari', 'Jamsaut', 'Mainpura', 'Kothia'],
      Nasriganj: ['Digha Diyara', 'Balupar', 'Makhdumpur', 'Kurji'],
    },
    Masaurhi: {
      Taregna: ['Bhadwan', 'Karariya', 'Chainpur', 'Bhelura'],
      Baurhi: ['Chhathoo', 'Hansrajpur', 'Nizampur', 'Korma'],
      Nema: ['Bhaiswan', 'Pali', 'Dhanama', 'Khaira'],
    },
  },
  Nalanda: {
    Biharsharif: {
      Maghra: ['Paharpur', 'Silao Road', 'Muraura', 'Sohsarai'],
      Murarpur: ['Tiuri', 'Mahadeopur', 'Tungi', 'Chorsua'],
    },
    Rajgir: {
      Barhari: ['Nai Pokhar', 'Chhabilapur', 'Bhui', 'Mahuat'],
      Meyar: ['Gorawan', 'Pilkhi', 'Bangpur', 'Lodhupur'],
    },
  },
  Muzaffarpur: {
    Motipur: {
      Singaila: ['Tajpur', 'Bheria', 'Mahmadpur', 'Pakar'],
      Baruraj: ['Hasanpur', 'Parsurampur', 'Rampur Kashi', 'Basatpur'],
    },
    Kanti: {
      Damodarpur: ['Kushi', 'Kolhua', 'Chhajjupur', 'Sadaatpur'],
      Madhuban: ['Bishunpur', 'Rampur Hari', 'Pipra', 'Kothia'],
    },
  },
  Gaya: {
    Bodhgaya: {
      Bakraur: ['Mastipur', 'Sujata Village', 'Bodhgaya Rural', 'Kandaha'],
      Mocharim: ['Khandail', 'Turi', 'Itawa', 'Paharpur'],
    },
    Tikari: {
      Mau: ['Bhatbigha', 'Alipur', 'Fatehpur', 'Kukra'],
      Ranipur: ['Gosainganj', 'Dariyapur', 'Chauri', 'Mahadeo Bigha'],
    },
  },
  Rohtas: {
    Sasaram: {
      Muradabad: ['Dumraon', 'Mahuari', 'Karwandia', 'Takia'],
      Kanchanpur: ['Amra', 'Baradih', 'Mokar', 'Dilia'],
    },
    Dehri: {
      Darihat: ['Tiura', 'Sujanpur', 'Khairahi', 'Baraon'],
      Jamuhar: ['Barkadih', 'Pachrukhiya', 'Bhaluahi', 'Paliya'],
    },
  },
};

export const DISTRICT_LIST = Object.keys(CASCADING_LOCATIONS);

export function getBlocks(district: string): string[] {
  if (!district || !CASCADING_LOCATIONS[district]) return [];
  return Object.keys(CASCADING_LOCATIONS[district]);
}

export function getPanchayats(district: string, block: string): string[] {
  if (!district || !block || !CASCADING_LOCATIONS[district]?.[block]) return [];
  return Object.keys(CASCADING_LOCATIONS[district][block]);
}

export function getVillages(district: string, block: string, panchayat: string): string[] {
  if (!district || !block || !panchayat || !CASCADING_LOCATIONS[district]?.[block]?.[panchayat]) return [];
  return CASCADING_LOCATIONS[district][block][panchayat];
}
