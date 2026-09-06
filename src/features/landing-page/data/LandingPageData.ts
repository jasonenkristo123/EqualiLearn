import type { Badge, Pillar, Step } from "../type/LandingPageType";

export const PILLARS: Pillar[] = [
  {
    title: "Transkripsi Langsung",
    description:
      "Konversi suara dosen dan lingkungan sekitar menjadi teks secara real-time, menciptakan catatan visual yang rapi dan permanen.",
    icon: "/images/transcription.svg",
  },
  {
    title: "Narator AI PPT",
    description:
      "Pembaca otomatis berbasis konteks yang mengubah slide presentasi dan materi kompleks menjadi narasi audio yang jernih.",
    icon: "/images/people-think.svg",
  },
  {
    title: "Kanvas Pikir",
    description:
      "Ruang kerja spasial minimalis untuk memetakan konsep visual tanpa distraksi, dirancang khusus meredakan beban sensorik berlebih.",
    icon: "/images/knowledge.svg",
  },
  {
    title: "Ruang Lingkar",
    description:
      "Ruang kolaborasi kelompok terpadu di mana seluruh fitur aksesibilitas terhubung dan bekerja secara otomatis dalam satu wadah.",
    icon: "/images/environment.svg",
  },
];

export const BADGEDATA: Badge[] = [
  {
    desc: "AUDIO NARRATOR",
  },
  {
    desc: "KANVAS SPASIAL",
  },
  {
    desc: "RUANG KOLABORASI",
  },
  {
    desc: "TRANSKRIP",
  },
  {
    desc: "AUDIO NARRATOR",
  },
  {
    desc: "KANVAS SPASIAL",
  },
  {
    desc: "RUANG KOLABORASI",
  },
  {
    desc: "TRANSKRIP",
  },
  {
    desc: "AUDIO NARRATOR",
  },
  {
    desc: "KANVAS SPASIAL",
  },
  {
    desc: "RUANG KOLABORASI",
  },
  {
    desc: "TRANSKRIP",
  },
];

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Input Materi atau Sesi Kelas",
  },
  {
    number: "02",
    title: "Pilih Moda Aksesibilitas (AI Process)",
  },
  {
    number: "03",
    title: "Belajar & Diskusi di Ruang Kerja",
  },
];
