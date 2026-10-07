const idsApiFootballPorLiga: Record<number, number> = {
  1: 2, 2: 13, 3: 15, 4: 3, 5: 11, 6: 17, 7: 848, 8: 16, 9: 531,
  10: 128, 11: 130, 12: 129,
  20: 71, 21: 72, 22: 73, 23: 475, 24: 624,
  30: 239, 31: 240, 32: 242,
  40: 265, 41: 266, 42: 267,
  50: 268, 51: 269, 60: 250,
  70: 242, 71: 243, 80: 281, 81: 282,
  100: 140, 101: 141, 102: 143, 103: 556,
  110: 39, 111: 40, 112: 45, 113: 48, 114: 528,
  120: 135, 121: 136, 122: 137,
  130: 78, 131: 79, 132: 81,
  140: 61, 141: 62, 142: 66,
  150: 94, 151: 96, 160: 88, 170: 203,
  200: 253, 201: 254, 205: 262, 206: 263,
  220: 162, 240: 307, 241: 98, 242: 292,
  300: 1, 301: 34, 302: 32, 303: 5, 304: 9, 305: 4,
};

const logosOficialesPorLiga: Record<number, string> = {
  70: 'https://upload.wikimedia.org/wikipedia/commons/9/91/LigaPro_Ecuabet_2024.png',
};

export function obtenerLogoLiga(idLiga: number): string {
  if (logosOficialesPorLiga[idLiga]) return logosOficialesPorLiga[idLiga];
  const idProveedor = idsApiFootballPorLiga[idLiga];
  return idProveedor
    ? `https://media.api-sports.io/football/leagues/${idProveedor}.png`
    : '';
}