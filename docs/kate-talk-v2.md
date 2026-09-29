# KateTalk v2 — new doll script (Kate, 29.09.2026)

Replaces the script in `lib/kate-talk.ts`. Queued after the WebGL migration and Kate's 5 post-migration tasks (task 6).

Implementation notes:
- Decided (Kate, 29.09): "What are you working on?" is a SIBLING of the root's first option (both shown at the root), not reached after it. Every root also keeps "I'll leave you to it." ✕ as its last option.
- New editions get their own roots: `evening_guitar` (19–21), `morn_ready`/fallback text updated.
- Some branches go 3 deep (Чтение → Again?, Улица → Like what?, Гитара → This website?) — update the "Two steps deep at most" comment in `lib/kate-talk.ts`.
- Keep each sentence ≤ ~66 chars, a node ≤ 3 lines (panel limit, see file header). Check long ones: "Apparently I didn't get enough existential dread the first time.", "Second time round, you watch how it’s built, not the plot."
- British English, curly apostrophes as written.

---

Общая ветка

Kate: Hey.

→ Am I interrupting?
Kate: A little. But go on.

→ What do you do?
Kate: Product design. Mostly complicated things.

→ The long version → /#profile
→ Got it. ✕

→ I’ll leave you to it. ✕

Будильник

Вт–Пт · 07:00–07:30

Kate: Hey. I’m not awake yet.

→ Still in bed?
Kate: Yep. Snoozed it twice already.

→ What do you do? → общая ветка
→ I’ll let you wake up. ✕

Пн · 07:00–07:30

Kate: Hey. It’s Monday. Give me a minute.

→ Still in bed?
Kate: Yep. I’m pretending I have another ten minutes.

→ What do you do? → общая ветка
→ Take your ten minutes. ✕

Утро

Пн–Пт · 07:30–09:00

Kate: Hey. Coffee first. Give me a second.

→ What’s in the mug?
Kate: Coffee. The mushroom mug is non-negotiable.
Kate: It’s survived three jobs with me.

→ What do you do? → общая ветка
→ Fair enough. ✕

Работа

Вт–Пт · 09:00–10:00

Kate: Hey. Standup. Camera’s off.

→ Am I interrupting?
Kate: Technically, yes. But go on.

→ What are you working on?
Kate: A product with too many screens and a few decisions still missing.

→ Show me → /#case-files
→ I’ll let you work. ✕

Пн · 09:00–10:00

Kate: Hey. Monday standup. Second coffee.

→ Already?
Kate: It’s Monday.

→ What are you working on?
Kate: A product with too many screens and a few decisions still missing.

→ Show me → /#case-files
→ Fair. ✕

Пн–Пт · 10:00–13:00

Kate: Hey. Deep work. Don’t tell anyone I’m here.

→ Am I interrupting?
Kate: A little. But you’re already here.

→ What are you working on?
Kate: A product with too many screens. I’m trying to make it need fewer.

→ Show me → /#case-files
→ I’ll disappear. ✕

Пн–Пт · 14:00–16:00

Kate: Hey. Calls. Back to back.

→ All afternoon?
Kate: Pretty much. My calendar made some choices for me.

→ What are you working on?
Kate: Several things at once, apparently.

→ Show me → /#case-files
→ Good luck. ✕

Пн–Пт · 16:00–17:00

Kate: Hey. Writing tomorrow down before I forget it.

→ Long list?
Kate: Longer than it was this morning.

→ What are you working on?
Kate: Enough to need a list.

→ Show me → /#case-files
→ See you tomorrow, then. ✕

Пт · 17:00–17:58

Kate: Hey. Last call of the week. There’s wine in this mug.

→ Wine?
Kate: It’s Friday. Don’t judge me.

→ What are you working on?
Kate: Nothing in about fifty-eight minutes.

→ Show me before you go → /#case-files
→ Fair. ✕

Ночь

Будни · 23:00–07:00

Выходные · 23:00–08:00

Kate: Hey. Everyone’s asleep. Best time to work.

→ You’re still working?
Kate: Yeah. Nobody needs anything at this hour.

→ What are you working on?
Kate: Something I said I’d finish earlier.

→ Show me → /#case-files
→ I’ll leave you to it. ✕

Чтение

Пн–Пт · 13:00–14:00

Kate: Hey. Lunch. And a few pages.

→ What are you reading?
Kate: Harari. Again.

→ Again?
Kate: Apparently I didn’t get enough existential dread the first time.

→ What do you do? → общая ветка
→ Enjoy your lunch. ✕

Каждый день · 21:00–23:00

Kate: Hey. Reading. Tea’s gone cold again.

→ What are you reading?
Kate: Harari. Again.

→ Again?
Kate: I reread things. Books, designs, conversations. Everything, apparently.

→ What do you do? → общая ветка
→ I’ll let you read. ✕

Выходное утро

Сб–Вс · 08:00–11:00

Kate: Hey. Pancakes. No work yet.

→ Yet?
Kate: I know myself.

→ What do you do? → общая ветка
→ Enjoy the pancakes. ✕

Улица

Пт · 17:58–18:00

Kate: Hey. Laptop’s shut. I’m leaving.

→ Where to?
Kate: Outside. That’s the whole plan.

→ Show me what you were working on → /#case-files
→ Go. ✕

Пн–Чт · 17:00–19:00

Пт · 18:00–19:00

Kate: Hey. Out walking. No destination.

→ Just walking?
Kate: Yep. Things tend to make more sense after a few kilometres.

→ Like what?
Kate: Mostly work. Sometimes life. Work is easier.

→ Show me the work part → /#case-files
→ Keep walking. ✕

Уборка

Сб–Вс · 11:00–13:00

Kate: Hey. Cleaning. Don’t look at the floor.

→ That bad?
Kate: It gets worse before it gets better. Allegedly.

→ What do you do when you’re not doing this?
Kate: Product design. Much easier to undo.

→ The long version → /#profile
→ I’ll pretend I saw nothing. ✕

Фильмы / сериалы

Сб–Вс · 13:00–19:00

Kate: Hey. I’m rewatching something.

→ What are you watching?
Kate: Something with a detective in it.
Kate: I already know who did it.

→ Then why watch it again?
Kate: Second time round, you watch how it’s built, not the plot.
Kate: I do the same thing with design.

→ Show me some of that → /#case-files
→ Makes sense. ✕

→ Enjoy. ✕

Гитара

Каждый день · 19:00–21:00

Kate: Hey. Learning guitar. Emphasis on learning.

→ Just started?
Kate: Pretty much. I played a bit at university, years ago.

→ Why guitar?
Kate: This site reminded me I’d wanted to learn for years.
Kate: So, why not now?

→ What else do you do when you’re not working?
Kate: Quite a few things, actually.

→ Show me → /#off-duty
→ Maybe later. ✕

morn_ready / ручной fallback

Kate: Hey. You found me.

→ Am I interrupting?
Kate: Not really. Go on.

→ What do you do?
Kate: Product design. Mostly complicated things.

→ The long version → /#profile
→ Got it. ✕
