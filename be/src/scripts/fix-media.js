#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import axios from 'axios';
import Movie from '../models/movie.model.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function pickTrailerFromVideos(videos) {
  if (!videos || !videos.results) return '';
  const list = videos.results;
  const yt = list.filter(v => v.site === 'YouTube');
  const pick = (arr, predicates) => {
    for (const p of predicates) {
      const found = arr.find(p);
      if (found) return found;
    }
    return null;
  };
  const selected = pick(yt, [
    v => /Trailer/i.test(v.type) && (v.iso_639_1 === 'vi' || v.iso_639_1 === 'vi-VN'),
    v => /Trailer/i.test(v.type) && v.iso_639_1 === 'en',
    v => /Trailer/i.test(v.type),
    v => /Official/i.test(v.name) && /Trailer/i.test(v.type),
    v => /Teaser/i.test(v.type),
    () => true,
  ]);
  return selected ? `https://www.youtube.com/embed/${selected.key}` : '';
}

async function fixMedia() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || undefined });
  console.log('MongoDB connected for media fix.');

  const cursor = Movie.find({ $or: [ { trailerUrl: { $in: [null, ''] } }, { posterUrl: { $in: [null, '', /placeholder/] } } ] }).cursor();
  let updated = 0;
  let total = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;
    try {
      const tmdbId = doc.tmdbId;
      if (!tmdbId) continue;
      const res = await axios.get(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=videos`);
      const m = res.data;
      let changed = false;

      // poster fallback
      const posterPath = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null;
      const backdropPath = m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : null;
      const finalPoster = posterPath || backdropPath || doc.posterUrl || null;
      if (finalPoster && finalPoster !== doc.posterUrl) {
        doc.posterUrl = finalPoster;
        changed = true;
      }

      // trailer fallback
      const trailerFromVideos = await pickTrailerFromVideos(m.videos);
      const finalTrailer = trailerFromVideos || m.homepage || doc.trailerUrl || '';
      if (finalTrailer && finalTrailer !== doc.trailerUrl) {
        doc.trailerUrl = finalTrailer;
        changed = true;
      }

      if (changed) {
        await doc.save();
        updated++;
        console.log(`Updated movie ${doc.title} (tmdb:${tmdbId}) - poster:${!!finalPoster} trailer:${!!finalTrailer}`);
      } else {
        console.log(`No change for ${doc.title} (tmdb:${tmdbId})`);
      }
    } catch (err) {
      console.warn(`Error fixing media for ${doc.title} (${doc.tmdbId}): ${err.message}`);
    }
  }

  console.log(`Done. Processed ${total} movies, updated ${updated}.`);
  await mongoose.disconnect();
  process.exit(0);
}

fixMedia().catch(err => { console.error(err); process.exit(1); });

