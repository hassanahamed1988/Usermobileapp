import os

filename = 'src/views/MonthlyFileDetails.tsx'
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[12px] sm:text-[13px] font-black text-[#001F3F] dark:text-white tracking-tight whitespace-nowrap">
                          {`${currency.code} ${tripDue.toLocaleString()}`}
                        </span>
                        {tripDue !== tripAmount && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 line-through">
                            {`${currency.code} ${tripAmount.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={20} className="text-[#8B5E3C] transition-colors shrink-0" />
                    </div>"""

replacement = """                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {tripDue > 0 && (
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[12px] sm:text-[13px] font-black text-[#001F3F] dark:text-white tracking-tight whitespace-nowrap">
                            {`${currency.code} ${tripDue.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      <ChevronRight size={20} className="text-[#8B5E3C] transition-colors shrink-0" />
                    </div>"""

if target in content:
    print('Found with standard LF!')
    content = content.replace(target, replacement)
elif target.replace('\n', '\r\n') in content:
    print('Found with CRLF!')
    content = content.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
else:
    print('Checking fallback...')
    # Let's search for part of it
    partial_target = """                        {tripDue !== tripAmount && ("""
    if partial_target in content:
        print('Found partial target!')

with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
