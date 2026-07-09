# Demo Video Asset

## Submission-Ready Local MP4

Generated local MP4:

`submission/cross-border-ips-ai-agent-demo.mp4`

Public web copy for Vercel hosting:

`public/cross-border-ips-ai-agent-demo.mp4`

After deployment, use:

`https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4`

The video is a 1080p, approximately 3 minute 33 second, judge-facing walkthrough with an ElevenLabs voiceover and burned-in captions. It was generated locally because InVideo workspace export was unreliable.

Voiceover source:

`submission/elevenlabs_voiceover.mp3`

## Rebuild

```bash
python3 scripts/build_demo_video.py --voiceover submission/elevenlabs_voiceover.mp3
cp submission/cross-border-ips-ai-agent-demo.mp4 public/cross-border-ips-ai-agent-demo.mp4
```

## Required Final Review Before Submission

Before submitting, quickly review the generated video for claim discipline.

The video should say:

- "FHIR IPS is the interoperable artifact; PDFs are human-readable renderings."
- "Readiness checks only, not national certification."
- "FedAvg gives data locality only, not a formal privacy guarantee."

The video should not say:

- "certified national conversion"
- "fully private federated learning"
- "production clinical decision support"

If any wording is changed later, preserve these claim boundaries.
