### issues - PR 
когда opus-4-6 был по умолчанию, то указывать:
```
/solve https://github.com/bpmbpm/rdf-grapher/issues/143 --model opus-4-5
/solve https://github.com/bpmbpm/rdf-grapher/pull/318 --model opus-4-5
```
теперь opus-4-5 по default
```
/solve https://github.com/bpmbpm/rdf-grapher/issues/9 --model opus
```

### models & agent 
```
/solve https://github.com/bpmbpm/rdf-grapher/issues/9 --tool agent
```
**--tool agent** - ранее grok code был по умолчанию, но больше недоступен бесплатно.  
Пример:
```
--tool agent --model opencode/big-pickle
```
выбор моделей Free:
- https://github.com/link-assistant/hive-mind/blob/main/docs/FREE_MODELS.md

### limits
/limits

Current time: Feb 18, 7:15pm UTC

CPU  
▓░░░░░░░░░░░░░░░░░░░│░░░░░░░░░ 3% used  
0.18/6 CPU cores

RAM  
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░│░░░░░░░░░ 32% used  
3.8/11.7 GB used

Disk space  
▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░│░░ 44% used  
41.8/95.8 GB used

GitHub API  
░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░ 1% used  
41/5000 requests
Resets in 58m (Feb 18, 8:11pm UTC)

Claude 5 hour session  
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 85% passed  
▓▓▓▓▓▓▓░░░░░░░░░░░░░│░░░░░░░░░ 24% used  
Resets in 0h 44m (Feb 18, 8:00pm UTC)

Current week (all models)  
▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░ 14% passed  
▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░│ 16% used  
Resets in 5d 23h 44m (Feb 24, 7:00pm UTC)

Current week (Sonnet only)  
▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 2% passed  
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ 0% used  
Resets in 6d 20h 44m (Feb 25, 4:00pm UTC)

Queues  
claude (pending: 0, processing: 5)  
agent (pending: 0, processing: 0)  

Расшифровка:  
pending - длинна очереди, то же самое, что при старте задачи, например, 
Waiting (pisition #5) - пятый в очереди

Только недельный лимит имеет значение. Должно быть Current week (all models): used (использовано) < passed (прошло).  
Иначе (как на картинке) расход (used) превышает план (16>14), т.е. расходуем быстрее, чем истекает время до сброса недельного лимита.  

На "пяти часовом" стоит автоматическое ограничение: замедляется очередь сама так, что вы 5-ти часовой лимит не почувствуете. Как только он (5-ти часовой) сбросится, очередь сама ускорится. 

### also
- browsec for https://www.ldf.fi/  
Request-URI Too Long (125 строк пролезает) + по умолчанию RDF, а не TriG
Передает данные RDF в сервис ldf.fi с явным указанием формата TriG ( from=trig)

### tools
- [calculator](https://link-assistant.github.io/calculator/?q=KGV4cHJlc3Npb24lMjAlMjIoRmViJTIwNiUyQyUyMDQlM0E1OXBtJTIwVVRDKSUyMC0lMjAoRmViJTIwMyUyQyUyMDUlM0EzNHBtJTIwVVRDKSUyMik)


