#!/bin/bash
sed -i 's/className="fixed inset-0 bg-black\/60 backdrop-blur-sm z-\[9999\] flex items-center justify-center p-4"/className="fixed inset-0 z-\[9999\] bg-black\/60 backdrop-blur-sm overflow-y-auto flex pt-\[max(2rem,env(safe-area-inset-top))\] pb-\[max(2rem,env(safe-area-inset-bottom))\] px-4 animate-fade-in"/g' src/views/Payment.tsx
