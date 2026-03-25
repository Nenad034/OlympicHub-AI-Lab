import { syncSolvexMedia } from './src/integrations/solvex/api/solvexMediaService.js';
// We might need to mock or setup context for syncSolvexMedia if it uses absolute imports
// But it uses relative ones in the file, so we'll see.
try {
    const result = await syncSolvexMedia();
    console.log(JSON.stringify(result));
} catch (e) {
    console.error(e);
}
