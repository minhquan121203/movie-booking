#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { autoSyncTMDB } from '../controllers/tmdb.controller.js';

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for TMDB resync.');
  const ok = await autoSyncTMDB();
  console.log('autoSyncTMDB finished:', ok);
  await mongoose.disconnect();
  process.exit(ok ? 0 : 2);
}

run().catch(err => { console.error(err); process.exit(1); });

