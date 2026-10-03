# Generates ambience.wav - a quiet seamless 4s "computer lab hum" loop.
# All component frequencies are integer multiples of 1/dur, so the loop is seamless.
import math, struct, wave

SR = 22050
DUR = 4.0
N = int(SR * DUR)
TWO_PI = 2.0 * math.pi

frames = bytearray()
for i in range(N):
    t = i / SR
    wob = 1.0 + 0.15 * math.sin(TWO_PI * 0.25 * t)   # 1 wobble cycle per loop
    v = (0.030 * math.sin(TWO_PI * 110.0 * t)
         + 0.020 * math.sin(TWO_PI * 220.0 * t)
         + 0.012 * math.sin(TWO_PI * 330.0 * t)) * wob
    s = int(max(-1.0, min(1.0, v)) * 32767)
    frames += struct.pack('<h', s)

with wave.open('ambience.wav', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(bytes(frames))
print('ambience.wav written:', N, 'samples,', DUR, 's')