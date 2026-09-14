#!/bin/bash
sed -i 's/p-5 sm:p-6/p-4 sm:p-5/g' src/views/Payment.tsx
sed -i 's/pb-3.5 mb-3.5/pb-3 mb-3/g' src/views/Payment.tsx
sed -i 's/my-3 \${amountBgClass}/my-2.5 \${amountBgClass}/g' src/views/Payment.tsx
sed -i 's/mb-1.5">/mb-1">/g' src/views/Payment.tsx
sed -i 's/mt-2.5">/mt-2">/g' src/views/Payment.tsx
sed -i 's/my-4 sm:my-5/my-3 sm:my-4/g' src/views/Payment.tsx
sed -i 's/space-y-3">/flex flex-col">/g' src/views/Payment.tsx
sed -i 's/mt-3 pt-3 border-t/mt-2 pt-2 border-t/g' src/views/Payment.tsx
sed -i 's/mt-4 pt-4 border-t/mt-3 pt-3 border-t/g' src/views/Payment.tsx
sed -i 's/mb-2 text-left/mb-1.5 text-left/g' src/views/Payment.tsx
sed -i 's/space-y-2">/space-y-1.5">/g' src/views/Payment.tsx
sed -i 's/p-2.5 sm:p-3/p-2 sm:p-2.5/g' src/views/Payment.tsx
