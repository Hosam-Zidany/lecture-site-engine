# المحاضرة 6 — Parsing & Derivation (التحليل النحوي والاشتقاق)
> **المادة:** مبادئ المترجمات (القسم النظري) | **الموضوع:** الاشتقاق، التحليل من أعلى لأسفل والعكس، التحليل التنبؤي، مجموعات First وFollow، وجداول الإنتاج

---

## 📌 خريطة التكامل (أين تقع هذه المحاضرة في الدورة؟)

| المرحلة | الأدوات | المخرجات |
| --- | --- | --- |
| التحليل المعجمي (`Lexical Analysis`) | `Scanner`، `DFA`، `NFA`، `Regular Expressions` | `Token Stream` |
| **التحليل النحوي (`Syntax Analysis`) ← أنت هنا** | `CFG`، `Derivation`، `Parse Tree`، `Top-Down`، `Bottom-Up`، `First`، `Follow`، `LL(1) Table` | `Parse Tree` / تقرير أخطاء نحوية |
| التحليل الدلالي (`Semantic Analysis`) | `Symbol Table`، `Type Checking` | `Annotated AST` |
| توليد الكود (`Code Generation`) | `AST`، `Stack Machine` | `Intermediate Code` |

> **نوع هذه المحاضرة:** Syntax Analysis — Parsing تطبيقي: اشتقاق، Top-Down vs Bottom-Up، التحليل التنبؤي LL(1)، حساب First وFollow، وبناء جدول الإنتاج.

---

## الجزء الأول: الشرح التفصيلي

### 1. Parsing & Derivation — المفاهيم الأساسية

#### النص الأصلي يقول:
> Context-free Grammar: `E → E + E | E * E | (E) | -(E) | Id`
> Derivation of –(Id): `E ⇒ –E ⇒ –(E) ⇒ –(Id)`
> In each step: Which nonterminal should be substituted / with which one

#### الشرح المبسّط:
`Parsing` هو عملية التحقق من أن سلسلة رموز (`Token Stream`) تنتمي إلى اللغة المعرّفة بقواعد نحوية (`CFG`). أما `Derivation` فهو عملية الإنتاج خطوة بخطوة: نبدأ من رمز البداية (`Start Symbol`) ونستبدل كل `Nonterminal` بأحد بدائله حتى نصل إلى السلسلة المطلوبة.

**لماذا؟** لأن المترجم يحتاج إلى التأكد من أن برنامجك صحيح نحوياً قبل تنفيذ أي شيء آخر. تخيّل اشتقاق الجملة مثل توسيع وصفة طبخ: "وجبة → بروتين + خضار → دجاج + خضار → دجاج + طماطم" — كل خطوة تستبدل مكوناً عاماً بمكون أكثر تحديداً.

💡 **التشبيه:**
> الـ`Derivation` مثل رسالة استدعاء للجيش: تبدأ بـ"الجندي" ثم تحدّد التخصص ثم الاسم.
> **وجه الشبه:** `Nonterminal` = منصب عام، `Terminal` = شخص محدد.

#### 📐 المعادلة: الاشتقاق

$$
E \Rightarrow -E \Rightarrow -(E) \Rightarrow -(Id)
$$

**الشرح:**
> `E` = رمز ابتداء (`Start Symbol`)، `⇒` = خطوة اشتقاق واحدة، `Id` = رمز طرفي (`Terminal`) يمثل معرّفاً، كل خطوة تستبدل `Nonterminal` واحداً بقاعدة إنتاج.

---

### 1.1. قواعد النحو الخالية من السياق (CFG)

#### النص الأصلي يقول:
> `E → E + E | E * E | (E) | -(E) | Id`

#### الشرح المبسّط:
`Context-Free Grammar (CFG)` تتكون من:
- `Nonterminals` (رموز غير طرفية): مثل `E` — تمثّل تصنيفاً لغوياً لم يُحدَّد بعد.
- `Terminals` (رموز طرفية): مثل `+`، `*`، `(`، `)` `Id` — الرموز الفعلية في الكود.
- `Productions` (قواعد الإنتاج): تحدد كيف يمكن استبدال كل `Nonterminal`.
- `Start Symbol`: `E` هنا هو نقطة البداية.

**لماذا نحتاج CFG؟** لأن التعابير الرياضية والبرمجية لها بنية متداخلة (nested) لا تستطيع `Regular Expressions` وصفها.

#### 🤔 تفعيل الفهم (اسأل نفسك):
> **سؤال:** لماذا القاعدة `E → E + E` تسمّى "عودية يسرى" (`Left Recursive`)؟
> **لماذا هذا مهم؟** لأن العودية اليسرى تُسبب حلقات لا نهائية في `Top-Down Parsing`، مما يجعلنا نضطر لتحويل القواعد قبل بناء المحلل.

---

### 2. أنواع الاشتقاق: Leftmost vs Rightmost

#### النص الأصلي يقول:
> Derivation of –(Id+Id)?????
> (Leftmost) `E ⇒ –E ⇒ –(E) ⇒ –(E+E) ⇒ –(Id+E) ⇒ –(Id+Id)`
> (Rightmost) `E ⇒ –E ⇒ –(E) ⇒ –(E+E) ⇒ –(E+Id) ⇒ –(Id+Id)`

#### الشرح المبسّط:
في كل خطوة اشتقاق يوجد أكثر من `Nonterminal`، فكيف نختار أيهما نستبدل؟ هناك استراتيجيتان:

| النوع | القاعدة | المثال |
| --- | --- | --- |
| `Leftmost Derivation` | استبدل دائماً أقصى `Nonterminal` يساراً | `–(E+E) ⇒ –(Id+E)` |
| `Rightmost Derivation` | استبدل دائماً أقصى `Nonterminal` يميناً | `–(E+E) ⇒ –(E+Id)` |

**لماذا يهم هذا الاختيار؟**
- `Top-Down Parsers` تستخدم `Leftmost Derivation`.
- `Bottom-Up Parsers` تستخدم عكس `Rightmost Derivation` (أي تعيد بناء `Rightmost` بالعكس).

💡 **التشبيه:**
> مثل قراءة كتاب: `Leftmost` = تقرأ من اليسار إلى اليمين بالترتيب، `Rightmost` = تقرأ من اليمين.
> **وجه الشبه:** الترتيب يحدد أيّ جزء من الجملة "ينضج" أولاً.

#### 🔍 تتبع التنفيذ: Leftmost Derivation لـ –(Id+Id)

**المدخل:** `–(Id+Id)`

| الخطوة | العملية | الحالة الحالية |
| --- | --- | --- |
| 0 | ابدأ من Start Symbol | `E` |
| 1 | طبّق `E → –E` (أقصى يسار = E) | `–E` |
| 2 | طبّق `E → (E)` على E الوحيدة | `–(E)` |
| 3 | طبّق `E → E+E` | `–(E+E)` |
| 4 | طبّق `E → Id` على E اليسرى | `–(Id+E)` |
| 5 | طبّق `E → Id` على E اليمنى | `–(Id+Id)` ✓ |

**النتيجة:** تم الاشتقاق بنجاح في 5 خطوات.

---

### 3. Top-Down Parsing (التحليل من أعلى لأسفل)

#### النص الأصلي يقول:
> - Leftmost Derivation
> - Building Parse Tree from the root down to the leafs
> - The general case is called Recursive Descent in which some backtracking cases can appear
> - A special case is called Predictive parsing and is Backtracking Free
> - We can perform predictive parsing if the rules are left factorized and have no left recursion problems

#### الشرح المبسّط:
`Top-Down Parsing` يبدأ من جذر شجرة الاشتقاق (`Root`) ويحاول بناء الشجرة نزولاً نحو الأوراق (`Leaves`) لمطابقة الجملة المدخلة.

#### 📊 المخطط: أنواع Top-Down Parsing

#### ما هذا المخطط؟
> يوضّح التقسيم الرئيسي لـ`Top-Down Parsing` وعلاقة الأنواع ببعضها.

#### وصف العُقد:
| # | العُقدة | النوع `kind` | الشرح |
| --- | --- | --- | --- |
| 1 | `Top-Down Parsing` | `root` | التصنيف الرئيسي |
| 2 | `Recursive Descent` | `process` | الحالة العامة — قد تحتوي backtracking |
| 3 | `Predictive Parsing` | `process` | حالة خاصة — بدون backtracking |
| 4 | `Backtracking` | `decision` | إعادة المحاولة عند الفشل |
| 5 | `LL(1) Parser` | `output` | المحلل التنبؤي المبني على جدول |

#### وصف الروابط:
| من | إلى | التسمية | نوع السهم | الشرح |
| --- | --- | --- | --- | --- |
| `Top-Down Parsing` | `Recursive Descent` | الحالة العامة | `→` | يستخدم Leftmost Derivation |
| `Top-Down Parsing` | `Predictive Parsing` | حالة خاصة | `→` | يتطلب Left Factoring وإزالة Left Recursion |
| `Recursive Descent` | `Backtracking` | قد يحدث | `→` | عند فشل مسار نستعيد |
| `Predictive Parsing` | `LL(1) Parser` | ينتج | `→` | يُبنى بجدول First/Follow |

```diagram
type: flowchart
title: Top-Down Parsing Types
direction: TD
nodes:
  - id: tdp
    label: Top-Down Parsing
    kind: root
    level: 0
  - id: rd
    label: Recursive Descent
    kind: process
    level: 1
  - id: pp
    label: Predictive Parsing
    kind: process
    level: 1
  - id: bt
    label: Backtracking
    kind: decision
    level: 2
  - id: ll1
    label: LL(1) Parser
    kind: output
    level: 2
edges:
  - from: tdp
    to: rd
    label: "الحالة العامة"
  - from: tdp
    to: pp
    label: "حالة خاصة (بدون backtracking)"
  - from: rd
    to: bt
    label: "قد يحدث"
  - from: pp
    to: ll1
    label: "ينتج"
```

**الفهم الخاطئ الشائع ❌:** كل `Top-Down Parser` يستخدم `Backtracking`.
**الفهم الصحيح ✅:** `Predictive Parsing` هو نوع من `Top-Down` لكنه بدون `Backtracking` إذا تحققت شروط القواعد.

#### مهم للامتحان ⚠️:
> شرط `Predictive Parsing`: يجب أن تكون القواعد **خالية من العودية اليسرى** (`No Left Recursion`) و**محوّلة بعامل مشترك يساري** (`Left Factored`). بدون هذين الشرطين لا يمكن بناء جدول LL(1) بدون تعارض.

---

### 3.1. Recursive Descent Parsing with Backtracking

#### النص الأصلي يقول:
> `S → cAd` , `A → ab | a` , W=cad
> `S → cAd → cabd → cAd → cad`

#### الشرح المبسّط:
في `Recursive Descent` نجرب كل قاعدة إنتاج بالترتيب. إذا فشلنا نرجع (`Backtrack`) ونجرب البديل التالي.

**مثال على W=cad:**
1. نطبق `S → cAd`: نحتاج c ثم A ثم d.
2. c يطابق. الآن نحتاج A.
3. نجرب `A → ab`: يُنتج "ab" → السلسلة تصبح "cabd" — لكن المدخل "cad"، الـd في المدخل لا يطابق b → **فشل**.
4. **Backtrack** → نجرب `A → a`: يُنتج "a" → السلسلة "cad" → يطابق ✓.

💡 **التشبيه:**
> مثل البحث عن مفتاح في حلقة مفاتيح: تجرب الأول، إذا فشل تجرب الثاني، حتى تجد الصحيح.
> **وجه الشبه:** كل `Production` = مفتاح، `Backtrack` = تجربة المفتاح التالي.

#### ⚙️ الخطوات / الخوارزمية: Recursive Descent مع Backtracking

#### ما هدف هذه العملية؟
> بناء شجرة اشتقاق لسلسلة مدخلة بتجربة كل قاعدة إنتاج بالترتيب والرجوع عند الفشل.

```algorithm
1 | ابدأ من Start Symbol | Stack | ضع Start Symbol في المكدس
2 | قارن قمة المكدس مع الرمز الحالي في المدخل | Input Pointer | إذا تطابق: أزل من المكدس وتقدم في المدخل
3 | إذا كان قمة المكدس Nonterminal | Production Table | جرّب أول قاعدة إنتاج
4 | إذا فشلت المطابقة | Backtrack | ارجع وجرّب القاعدة التالية
5 | إذا نجحت كل الخطوات والمدخل انتهى | Accept | القبول
6 | إذا نفدت كل البدائل | Error | رفض الجملة
```

#### نقاط التنفيذ:
- `Backtracking` مكلف حسابياً — يُفضَّل تجنّبه باستخدام `Predictive Parsing`.
- ترتيب تجربة القواعد مهم: إذا جرّبت `A → a` قبل `A → ab` في المثال أعلاه قد تقبل سلسلة خاطئة.

---

### 3.2. Predictive Parsing — التحليل التنبؤي (بدون Backtracking)

#### النص الأصلي يقول:
> Predictive Parsing (Without Backtracking)
> `S → if E then S else S | while E do S | begin S end`

#### الشرح المبسّط:
في `Predictive Parsing` نستطيع معرفة أيّ قاعدة نطبّق بالنظر إلى **الرمز التالي في المدخل فقط** (بدون تجربة). لذلك سُمّي "تنبؤياً".

**لماذا يمكن ذلك هنا؟**
- `S → if E then S else S` تبدأ بـ`if` — نعرف فوراً أننا نحتاج هذه القاعدة إذا رأينا `if`.
- `S → while E do S` تبدأ بـ`while` — نستخدمها عند رؤية `while`.
- `S → begin S end` تبدأ بـ`begin`.

هذا ممكن لأن كل قاعدة **تبدأ بـ`Terminal` مختلف** → لا يوجد تعارض.

#### مهم للامتحان ⚠️:
> `Predictive Parsing` يتطلب أن يكون `First` لكل بديلَيْن من نفس الـ`Nonterminal` مختلفَيْن تماماً (بدون تقاطع). إذا كان `First(A → α) ∩ First(A → β) ≠ ∅` فلا يمكن بناء جدول LL(1) بدون تعارض.

#### 🤔 تفعيل الفهم (اسأل نفسك):
> **سؤال:** ماذا لو كانت القاعدة `S → if E then S | if E then S else S`؟ هل يمكن `Predictive Parsing`؟
> **لماذا هذا مهم؟** هذا مثال على مشكلة `Dangling Else` الشهيرة — كلتا القاعدتين تبدآن بـ`if`، مما يسبب تعارضاً في جدول LL(1).

---

### 4. Bottom-Up Parsing (التحليل من أسفل لأعلى)

#### النص الأصلي يقول:
> Building Tree from leafs going up until the root
> - Operator Precedence Parsing
> - Shift Reduce Parsing or (LR Parsing)
> Using Shift Reduce Parsing we try to reduce the sentence in order to deduce the original symbol from which the sentence is generated

#### الشرح المبسّط:
`Bottom-Up Parsing` يعمل بالعكس: يبدأ من الرموز الطرفية (`Terminals`) في السلسلة ويحاول دمجها (`Reduce`) إلى `Nonterminals` حتى يصل إلى `Start Symbol`.

| الاتجاه | يبدأ من | يسير نحو | يستخدم |
| --- | --- | --- | --- |
| `Top-Down` | `Start Symbol` (الجذر) | `Terminals` (الأوراق) | `Leftmost Derivation` |
| `Bottom-Up` | `Terminals` (الأوراق) | `Start Symbol` (الجذر) | عكس `Rightmost Derivation` |

#### 🔍 تتبع التنفيذ: Bottom-Up لـ W=cabd

**المدخل:** `cabd` مع القواعد `S → cAd` و `A → ab | a`

| الخطوة | العملية | السلسلة الحالية |
| --- | --- | --- |
| 0 | ابدأ بالسلسلة | `cabd` |
| 1 | `ab → A` (تطبيق `A → ab` عكسياً) | `cAd` |
| 2 | `cAd → S` (تطبيق `S → cAd` عكسياً) | `S` ✓ |

**النتيجة:** وصلنا إلى `Start Symbol` → القبول.

#### أنواع Bottom-Up Parsing:

| النوع | الفكرة | الاستخدام |
| --- | --- | --- |
| `Operator Precedence Parsing` | يعتمد على أولوية العمليات | تعابير حسابية بسيطة |
| `Shift Reduce Parsing` / `LR Parsing` | Shift (نقل) + Reduce (اختزال) | أقوى وأشمل |

💡 **التشبيه:**
> `Bottom-Up` مثل تجميع قطع بازل: تبدأ بالقطع المتفرقة وتجمعها حتى تكتمل الصورة.
> **وجه الشبه:** الأوراق = القطع، `Start Symbol` = الصورة الكاملة.

---

### 5. Top-Down Predictive Parsing — المكونات والبنية

#### النص الأصلي يقول:
> Non Recursive Parser Components: Table of Productions, Stack, Input String, Processing Program
> [مخطط يُظهر: Input String ↔ Program ↔ Stack + Productions Table]

#### الشرح المبسّط:
`Predictive Parsing` اللاعودي (`Non-Recursive`) يُدار بجدول (`Table-Driven`) ويتكون من:

#### 📊 المخطط: مكونات Non-Recursive Predictive Parser

#### ما هذا المخطط؟
> يوضّح المكونات الأربعة للمحلل التنبؤي اللاعودي وكيف تتفاعل.

#### وصف العُقد:
| # | العُقدة | النوع `kind` | الشرح |
| --- | --- | --- | --- |
| 1 | `Input String` | `input` | سلسلة الرموز المدخلة + `$` في النهاية |
| 2 | `Program` | `process` | المحرك الرئيسي للتحليل |
| 3 | `Stack` | `storage` | يحتوي `Terminals` و`Nonterminals` + `$` في القاع |
| 4 | `Productions Table` (جدول M) | `table` | M[X, a] = القاعدة التي تُطبَّق |

#### وصف الروابط:
| من | إلى | التسمية | نوع السهم | الشرح |
| --- | --- | --- | --- | --- |
| `Input String` | `Program` | يقرأ الرمز الحالي | `→` | يقدّم الرمز التالي |
| `Program` | `Stack` | يدفع/يسحب | `↔` | يضع الإنتاجات |
| `Program` | `Productions Table` | يستشير | `↓` | يختار القاعدة المناسبة |

```diagram
type: flowchart
title: Non-Recursive Predictive Parser Components
direction: LR
nodes:
  - id: input
    label: Input String
    kind: input
    level: 0
  - id: prog
    label: Program (Driver)
    kind: process
    level: 1
  - id: stack
    label: Stack
    kind: storage
    level: 1
  - id: table
    label: Productions Table M[X,a]
    kind: table
    level: 2
edges:
  - from: input
    to: prog
    label: "رمز المدخل الحالي"
  - from: prog
    to: stack
    label: "push/pop"
  - from: prog
    to: table
    label: "استشارة M[X,a]"
```

#### الحالة الابتدائية (Initial State):
- **Stack**: يحتوي على `E` (Start Symbol) في القمة و`$` في القاع.
- **Input**: `a + b $` (السلسلة + علامة نهاية المدخل).

---

### 6. جدول الإنتاج (Table of Productions) M[X, a]

#### النص الأصلي يقول:
> جدول M[X,a] حيث X = Nonterminal و a = رمز المدخل الحالي
> القواعد المستخدمة: `E → TE1`, `E1 → +TE1 | ε`, `T → FT1`, `T1 → *FT1 | ε`, `F → (E) | Id`
> If (X is NonTerminal && a is the Current Input Symbol): The Program Consults M[X,a], if (Not Error): Replace X by M[X,a]

#### الشرح المبسّط:
جدول الإنتاج `M` هو قلب `Predictive Parsing`. بُعداه:
- **الصفوف**: `Nonterminals` (E، E1، T، T1، F)
- **الأعمدة**: `Terminals` (Id، +، *، (، )، $)
- **الخلية**: القاعدة التي تُطبَّق عند وجود هذا الـ`Nonterminal` في القمة وهذا الـ`Terminal` في المدخل.

**جدول M المكتمل:**

| | `Id` | `+` | `*` | `(` | `)` | `$` |
| --- | --- | --- | --- | --- | --- | --- |
| **E** | `E: TE1` | | | `E: TE1` | | |
| **E1** | | `E1: +TE1` | | | `E1: ε` | `E1: ε` |
| **T** | `T: FT1` | | | `T: FT1` | | |
| **T1** | | `T1: ε` | `T1: *FT1` | | `T1: ε` | `T1: ε` |
| **F** | `F: Id` | | | `F: (E)` | | |

**قاعدة استخدام الجدول:**
- إذا كان X `Nonterminal` → استشر M[X, a] واستبدل X بمحتوى الخلية.
- إذا كانت الخلية فارغة → **خطأ نحوي**.
- إذا كانت الخلية `ε` → أزل X من المكدس بدون قراءة من المدخل.
- إذا كان X `Terminal` وطابق a → أزل X وتقدم في المدخل.

#### 🤔 تفعيل الفهم (اسأل نفسك):
> **سؤال:** لماذا خلية M[E1, )] = ε وليست خطأ؟
> **لماذا هذا مهم؟** لأن E1 قد تكون فارغة بعد إغلاق القوس، وهذا يعني أن E1 يمكن أن "تختفي" عند رؤية `)`. الإجابة مرتبطة بـ`Follow(E1)` الذي يحتوي `)` و`$`.

---

### 7. First و Follow — المفاهيم والحساب

#### النص الأصلي يقول:
> **First:** The first Terminal that we get when we substitute the non-terminal
> - First(E)=First(T)=First(F)={(, Id}
> - First(E1)={+, e}
> - First(T1)={*, e}
>
> **Follow:** The first terminal that we get after Substituting the non-terminal completely
> - Follow(E)=Follow(E1)={), $}
> - Follow(T)=Follow(T1)={+, ), $}
> - Follow(F)={+, *, ), $}

#### الشرح المبسّط:

**`First(X)`**: مجموعة كل الرموز الطرفية التي **يمكن أن تبدأ** بها أي سلسلة مشتقة من X.
- إذا كان X يمكن أن يُشتق إلى `ε` نضيف `ε` إلى `First(X)`.

**`Follow(X)`**: مجموعة كل الرموز الطرفية التي **يمكن أن تأتي مباشرة بعد** X في أي اشتقاق.
- دائماً نضع `$` في `Follow(Start Symbol)`.

#### 📐 المعادلة: حساب First

$$
First(\alpha) = \{ a \mid \alpha \Rightarrow^* a\beta \}
$$

**الشرح:**
> `α` = سلسلة من الرموز (Nonterminal أو Terminal)، `a` = Terminal يبدأ به الاشتقاق، `⇒*` = صفر أو أكثر من خطوات الاشتقاق، `β` = بقية السلسلة.

#### 📐 المعادلة: حساب Follow

$$
Follow(A) = \{ a \mid S \Rightarrow^* \alpha A a \beta \}
$$

**الشرح:**
> `A` = Nonterminal نحسب Follow له، `a` = Terminal يأتي بعد A، `S` = Start Symbol، `α`، `β` = سياق أي سلسلة.

#### جدول حساب First للقواعد المعطاة:

| المتغير | القاعدة | First |
| --- | --- | --- |
| `F` | `F → (E) \| Id` | `{(, Id}` |
| `T` | `T → FT1` | `First(F) = {(, Id}` |
| `T1` | `T1 → *FT1 \| ε` | `{*, ε}` |
| `E` | `E → TE1` | `First(T) = {(, Id}` |
| `E1` | `E1 → +TE1 \| ε` | `{+, ε}` |

#### جدول حساب Follow للقواعد المعطاة:

| المتغير | السبب | Follow |
| --- | --- | --- |
| `E` | Start Symbol → `$`؛ يظهر في `F → (E)` → `)` | `{), $}` |
| `E1` | `E → TE1` → `Follow(E1) = Follow(E)` | `{), $}` |
| `T` | `E → TE1` → `First(E1)-{ε}` + Follow(E) إذا ε∈First(E1) | `{+, ), $}` |
| `T1` | `T → FT1` → `Follow(T1) = Follow(T)` | `{+, ), $}` |
| `F` | `T → FT1` → `First(T1)-{ε}` + Follow(T) إذا ε∈First(T1) | `{+, *, ), $}` |

---

### 8. بناء جدول الإنتاج باستخدام First و Follow

#### النص الأصلي يقول:
> For each production X → Y:
> - for each a in First(X): M[X,a] = X → Y
> - for each b in Follow(X) if (X → ε): M[X,b] = X → ε

#### الشرح المبسّط:
الخوارزمية لبناء جدول M:

#### ⚙️ الخطوات / الخوارزمية: بناء جدول LL(1)

#### ما هدف هذه العملية؟
> بناء جدول M[X,a] الذي يوجّه `Predictive Parser` في كل خطوة.

```algorithm
1 | لكل قاعدة إنتاج X → α | First حساب | احسب First(α)
2 | لكل Terminal a في First(α) | جدول M | ضع M[X,a] = X → α
3 | إذا كان ε ∈ First(α) | Follow حساب | احسب Follow(X)
4 | لكل Terminal b في Follow(X) | جدول M | ضع M[X,b] = X → α
5 | إذا كان $ ∈ Follow(X) و ε ∈ First(α) | جدول M | ضع M[X,$] = X → α
6 | كل خلية فارغة | Error | تمثّل خطأ نحوي
```

#### نقاط التنفيذ:
- إذا وجدنا **تعارضاً** في خلية (خليتان أو أكثر) → القاعدة **ليست LL(1)** ولا يمكن استخدام `Predictive Parsing` مباشرة.
- الجدول يتحقق من **قابلية التحليل التنبؤي** للقواعد.

---

## الجزء الثاني: ملخص منظم

### أهم التعاريف والمفاهيم

| المصطلح | التعريف | مثال/ملاحظة |
| --- | --- | --- |
| `Parsing` | التحقق من صحة سلسلة وبناء شجرة اشتقاق | الخطوة الثانية في المترجم |
| `Derivation` | استبدال Nonterminal بقاعدة إنتاج خطوة بخطوة | `E ⇒ E+E ⇒ Id+E` |
| `Leftmost Derivation` | استبدال أقصى Nonterminal يساراً دائماً | يُستخدم في Top-Down |
| `Rightmost Derivation` | استبدال أقصى Nonterminal يميناً دائماً | عكسه يُستخدم في Bottom-Up |
| `Top-Down Parsing` | من الجذر إلى الأوراق | `Recursive Descent`، `Predictive` |
| `Bottom-Up Parsing` | من الأوراق إلى الجذر | `LR Parsing`، `Shift-Reduce` |
| `Recursive Descent` | Top-Down مع Backtracking عند الفشل | بطيء لكن يعمل مع أكثر القواعد |
| `Predictive Parsing` | Top-Down بدون Backtracking | يتطلب Left Factoring + No Left Recursion |
| `First(X)` | Terminals التي تبدأ أي اشتقاق من X | يُستخدم لبناء جدول M |
| `Follow(X)` | Terminals التي تأتي بعد X في أي اشتقاق | يُستخدم عند X → ε |
| `M[X,a]` | جدول الإنتاج للمحلل التنبؤي | M[E, Id] = E → TE1 |
| `LL(1)` | Left-to-right scan, Leftmost derivation, 1 lookahead | نوع Predictive Parser |
| `Shift-Reduce` | نقل رمز إلى المكدس أو اختزال أعلى المكدس | Bottom-Up |
| `Backtracking` | الرجوع وتجربة بديل آخر عند الفشل | مكلف حسابياً |

### المكونات الرئيسية (مرجع سريع)

| الأداة | الوظيفة | ملاحظة |
| --- | --- | --- |
| `Stack` | يحمل الرموز الحالية للمعالجة | يبدأ بـ`Start Symbol` + `$` |
| `Input Buffer` | يحمل سلسلة المدخل + `$` | مؤشر يتقدم للأمام فقط |
| `M[X,a]` | يوجّه قرارات المحلل | يُبنى من First + Follow |
| `First` | رموز البداية لكل Nonterminal | يحدد صفوف الجدول |
| `Follow` | رموز ما بعد كل Nonterminal | يحدد أماكن ε في الجدول |

### جداول مقارنات سريعة

| المقارنة | `Top-Down` | `Bottom-Up` | الفرق |
| --- | --- | --- | --- |
| اتجاه البناء | من الجذر → الأوراق | من الأوراق → الجذر | عكس بعضهما |
| نوع الاشتقاق | `Leftmost` | عكس `Rightmost` | — |
| قوة التحليل | أضعف (LL) | أقوى (LR) | LR يتعامل مع قواعد أكثر |
| التعقيد | أبسط | أعقد | — |
| مثال | `LL(1)`، `Recursive Descent` | `LR(0)`، `SLR`، `LALR` | — |

| المقارنة | `Recursive Descent` | `Predictive Parsing` | الفرق |
| --- | --- | --- | --- |
| Backtracking | نعم | لا | Predictive أكفأ |
| متطلبات القواعد | أي CFG | Left Factored + No Left Recursion | قيود على القواعد |
| التنفيذ | بالاستدعاء العودي | بجدول M | Table-driven أسرع |

| المقارنة | `First(X)` | `Follow(X)` | الفرق |
| --- | --- | --- | --- |
| ما يحسبه | Terminals تبدأ اشتقاق X | Terminals تأتي بعد X | سياق مختلف |
| متى يُستخدم | لكل قاعدة X → α | عند X → ε فقط | Follow للحالة الاستثنائية |
| هل يشمل ε؟ | نعم (إذا X → ε) | لا | Follow لا يحوي ε |

### قاموس المصطلحات

| الفئة | المصطلحات |
| --- | --- |
| الاشتقاق | `Derivation`، `Leftmost`، `Rightmost`، `Sentential Form` |
| التحليل | `Parsing`، `Parse Tree`، `Syntax Analysis` |
| أنواع المحللات | `Top-Down`، `Bottom-Up`، `Recursive Descent`، `Predictive`، `LR` |
| مفاهيم LL(1) | `First`، `Follow`، `LL(1) Table`، `M[X,a]`، `Non-Recursive Parser` |
| عمليات Bottom-Up | `Shift`، `Reduce`، `Shift-Reduce`، `Operator Precedence` |
| مشاكل القواعد | `Left Recursion`، `Left Factoring`، `Ambiguity` |

### أبرز النقاط الذهبية

1. `Predictive Parsing` يعمل فقط مع قواعد **خالية من العودية اليسرى** و**محوّلة بعامل مشترك**.
2. `First(X)` → يُستخدم لملء جدول M عند كل قاعدة X → α.
3. `Follow(X)` → يُستخدم **فقط** عند القاعدة X → ε.
4. خلية فارغة في جدول M = **خطأ نحوي**.
5. `Bottom-Up` أقوى من `Top-Down` — يتعامل مع قواعد أكثر.
6. الـ`Stack` في Predictive Parser يبدأ بـ`[Start Symbol, $]` والمدخل ينتهي بـ`$`.
7. إذا وُجد تعارض في جدول M → القواعد ليست `LL(1)`.

### الأخطاء الشائعة عند الطلاب ⚠️

| الخطأ | التصحيح |
| --- | --- |
| إضافة `ε` إلى `Follow` | `Follow` لا يحتوي أبداً على `ε` — فقط `Terminals` و`$` |
| نسيان `$` في `Follow(Start Symbol)` | `$` دائماً في Follow لرمز البداية |
| الخلط بين `First(X)` و`First(α)` حيث α هي يمين قاعدة X → α | `First(α)` يُحسب من أول رمز في α وليس من X |
| استخدام `Predictive Parsing` مع قواعد بها عودية يسرى | يجب إزالة Left Recursion أولاً |
| اعتبار خلية ε في الجدول = خطأ | `M[X,a] = X → ε` يعني "اطرح X من المكدس" وهو صحيح |

---

### خطوات وإجراءات المحاضرة

#### ⚙️ الخوارزمية: تشغيل Non-Recursive Predictive Parser

#### ما هدف هذه العملية؟
> تحليل سلسلة مدخلة بدون عودية باستخدام جدول M والمكدس.

```algorithm
1  | تهيئة | Stack | ضع [Start Symbol, $] في المكدس؛ ip يشير لأول رمز في المدخل
2  | X = top(Stack) | Stack | اقرأ قمة المكدس
3  | a = current input | Input | اقرأ الرمز الحالي في المدخل
4  | إذا X = $ و a = $ | Accept | القبول — نهاية التحليل
5  | إذا X = a (Terminal) | Stack + Input | pop(Stack)؛ ip++ (تقدم في المدخل)
6  | إذا X = Nonterminal | M[X,a] | استشر جدول M
7  | إذا M[X,a] = X → α | Stack | pop(X)؛ ادفع α معكوسةً على المكدس
8  | إذا M[X,a] = error | Error | أبلغ عن خطأ نحوي
9  | كرر من الخطوة 2 | — | حتى القبول أو الخطأ
```

#### نقاط التنفيذ:
- α تُدفع **معكوسة** لأن المكدس LIFO — أول رمز في α يجب أن يكون في القمة.
- مثال: لو `E → TE1` نضع E1 أولاً ثم T (T يكون في القمة).

---

#### ⚙️ الخوارزمية: حساب First(X)

#### ما هدف هذه العملية؟
> حساب مجموعة First لكل Nonterminal لبناء جدول LL(1).

```algorithm
1 | إذا X = Terminal | First | First(X) = {X}
2 | إذا X → ε ∈ Productions | First | أضف ε إلى First(X)
3 | إذا X → Y1 Y2 ... Yk | First | أضف First(Y1) - {ε}
4 | إذا ε ∈ First(Y1) | First | أضف First(Y2) - {ε}
5 | كرر حتى ε ∉ First(Yi) أو i > k | First | إذا ε في كل First(Yi) أضف ε لـFirst(X)
6 | كرر لكل Nonterminal | — | حتى لا يتغير أي First
```

---

#### ⚙️ الخوارزمية: حساب Follow(X)

#### ما هدف هذه العملية؟
> حساب مجموعة Follow لكل Nonterminal لإكمال جدول LL(1).

```algorithm
1 | Follow(Start Symbol) | Follow | أضف $ إليه
2 | لكل قاعدة A → αBβ | Follow | أضف First(β) - {ε} إلى Follow(B)
3 | إذا ε ∈ First(β) | Follow | أضف Follow(A) إلى Follow(B)
4 | لكل قاعدة A → αB | Follow | أضف Follow(A) إلى Follow(B)
5 | كرر | — | حتى لا يتغير أي Follow
```

---

### أنماط الأكواد والبنى المتكررة

| النمط | البنية الأساسية | متى تستخدمه |
| --- | --- | --- |
| قاعدة بدون Left Recursion | `E → T E1`، `E1 → +T E1 \| ε` | بعد إزالة Left Recursion من `E → E + T` |
| Left Factoring | `A → αβ \| αγ` يصبح `A → α A'`، `A' → β \| γ` | عند وجود prefix مشترك |
| قاعدة بـ ε | `E1 → ε` أو `T1 → ε` | عند Follow تملأ الجدول |

### أنماط التعامل والسلوك

| السيناريو | التعامل الصحيح | لماذا؟ |
| --- | --- | --- |
| قمة المكدس = Terminal ≠ رمز المدخل | أبلغ عن خطأ | تعارض غير قابل للحل |
| M[X,a] فارغة | أبلغ عن خطأ نحوي | الجملة لا تنتمي للغة |
| M[X,a] = X → ε | اطرح X فقط، لا تتقدم في المدخل | ε يعني "لا شيء" |
| Stack = `[$]` و Input = `[$]` | قبول | التحليل اكتمل بنجاح |

### الأفكار الرئيسية الشاملة

`Parsing` هو جوهر المرحلة الثانية في المترجم. الفكرة المحورية هي: **هل يمكننا معرفة القاعدة الصحيحة بالنظر إلى رمز واحد فقط من المدخل؟** إذا نعم → `LL(1)`. إذا لا → نحتاج `Backtracking` أو `LR Parsing`.

⚖️ **المقايضة: Top-Down vs Bottom-Up**

| | `Top-Down / LL(1)` | `Bottom-Up / LR` |
| --- | --- | --- |
| المزايا | أبسط تنفيذاً، سهل الفهم والتتبع | أقوى، يتعامل مع قواعد أكثر |
| العيوب | قيود على القواعد (No LR، Left Factored) | معقد البناء، صعب التتبع اليدوي |
| متى تختاره | قواعد بسيطة، parsers يدوية | قواعد برمجة حقيقية، أدوات توليد تلقائي |

---

## الجزء الثالث: أسئلة اختيار من متعدد (MCQ)

> **18 سؤالاً** — مستوى: medium/hard. التوزيع: مقارنات 20% | سيناريو كود 25% | تطبيق 25% | تتبع خوارزميات 30%.

---

### السؤال 1 (medium) — مقارنة
ما الفرق الجوهري بين `Leftmost Derivation` و`Rightmost Derivation`؟

أ) `Leftmost` يبني الشجرة من الأسفل، `Rightmost` من الأعلى
ب) `Leftmost` يستبدل أقصى Nonterminal يساراً في كل خطوة، `Rightmost` يستبدل أقصى يميناً
ج) `Leftmost` يُستخدم في Bottom-Up Parsing، `Rightmost` في Top-Down
د) لا فرق بينهما — كلاهما ينتجان نفس الشجرة دائماً

**الإجابة الصحيحة: ب**
**التعليل:**
- **أ** خاطئ: كلاهما نوع من Top-Down من حيث بناء الشجرة.
- **ب** صحيح: الاختلاف الوحيد هو أيّ Nonterminal نختار للاستبدال.
- **ج** خاطئ: العكس صحيح — `Leftmost` لـ Top-Down، وعكس `Rightmost` لـ Bottom-Up.
- **د** خاطئ: قد يُنتجان شجرتَيْن مختلفتَيْن لقواعد غامضة (Ambiguous).

---

### السؤال 2 (hard) — تطبيق
بالقواعد: `E → E+E | E*E | (E) | Id`، أيّ الاشتقاقات التالية هو `Leftmost Derivation` لـ `Id+Id*Id`؟

أ) `E ⇒ E+E ⇒ E+E*E ⇒ Id+E*E ⇒ Id+Id*E ⇒ Id+Id*Id`
ب) `E ⇒ E*E ⇒ E+E*E ⇒ E+E*Id ⇒ E+Id*Id ⇒ Id+Id*Id`
ج) `E ⇒ E+E ⇒ E+E*E ⇒ E+E*Id ⇒ E+Id*Id ⇒ Id+Id*Id`
د) `E ⇒ E+E ⇒ Id+E ⇒ Id+E*E ⇒ Id+Id*E ⇒ Id+Id*Id`

**الإجابة الصحيحة: أ**
**التعليل:**
- **أ** صحيح: في كل خطوة يُستبدل أقصى E يساراً. خطوة 3: أول E يساراً → Id؛ خطوة 4: E الوسطى → Id. التسلسل صحيح.
- **ب** خاطئ: الاشتقاق يبدأ بـE*E وليس E+E، ويستبدل E يميناً أحياناً.
- **ج** خاطئ: خطوة 4 تستبدل E الثانية وليس الأولى — هذا Rightmost جزئي.
- **د** صحيح تقنياً لـLeftmost لكن الخطوة 3 تنتج E*E من E الثانية وليس الأولى.

---

### السؤال 3 (medium) — نظري
متى يُمكن استخدام `Predictive Parsing`؟

أ) مع أي قواعد CFG بدون قيود
ب) فقط مع قواعد خالية من اليسار الأيسر (`No Left Recursion`) ومحوّلة بعامل مشترك (`Left Factored`)
ج) فقط مع قواعد لا تحتوي على ε
د) فقط مع قواعد `Right Linear`

**الإجابة الصحيحة: ب**
**التعليل:**
- **أ** خاطئ: لا يعمل مع كل CFG.
- **ب** صحيح: الشرطان ضروريان لضمان عدم التعارض في جدول M.
- **ج** خاطئ: ε مسموح بها وتُعالَج عبر Follow.
- **د** خاطئ: Right Linear تُستخدم في Lexical Analysis (Regular Grammars).

---

### السؤال 4 (hard) — تتبع خوارزميات (First)
بالقواعد: `E → TE1`، `E1 → +TE1 | ε`، `T → FT1`، `T1 → *FT1 | ε`، `F → (E) | Id`
ما هو `First(T1)`؟

أ) `{*, (, Id}`
ب) `{*, ε}`
ج) `{*, +, ε}`
د) `{*}`

**الإجابة الصحيحة: ب**
**التعليل:**
- `T1 → *FT1`: أول رمز هو `*` (Terminal) → يُضاف.
- `T1 → ε`: T1 يمكن أن تكون فارغة → يُضاف `ε`.
- **أ** خاطئ: `(` و`Id` هي First(F) وليست First(T1).
- **ب** صحيح.
- **ج** خاطئ: `+` ليس في First(T1)، بل في First(E1).
- **د** خاطئ: ينسى `ε`.

---

### السؤال 5 (hard) — تتبع خوارزميات (Follow)
بنفس القواعد السابقة، ما هو `Follow(T)`؟

أ) `{+, *, ), $}`
ب) `{+, ), $}`
ج) `{*, ), $}`
د) `{), $}`

**الإجابة الصحيحة: ب**
**التعليل:**
- `E → TE1`: T تليها E1. `First(E1) - {ε} = {+}` → أضف `+` لـFollow(T).
- بما أن `ε ∈ First(E1)` → أضف `Follow(E) = {), $}` لـFollow(T).
- **أ** خاطئ: `*` ليس في Follow(T)، `*` في First(T1) ويأتي بعد F.
- **ب** صحيح.
- **ج** خاطئ: `*` خاطئ كما شرحنا.
- **د** خاطئ: ينسى `+`.

---

### السؤال 6 (medium) — جدول الإنتاج
بجدول M، ماذا يعني أن تكون خلية M[E1, )] = `E1 → ε`؟

أ) خطأ نحوي عند وجود E1 في المكدس ورؤية `)`
ب) يجب قراءة `)` من المدخل والتقدم
ج) يجب إزالة E1 من المكدس بدون قراءة أي رمز من المدخل
د) يجب استبدال E1 بـ`)` في المكدس

**الإجابة الصحيحة: ج**
**التعليل:**
- `E1 → ε` يعني E1 تختفي (لا تُنتج شيئاً) → pop(E1) من المكدس.
- لا نتقدم في المدخل لأننا لم "نستهلك" أي رمز.
- **أ** خاطئ: ليس خطأ بل هذا مقصود.
- **ب** خاطئ: `)` سيُقرأ لاحقاً عند مطابقة Terminal.
- **د** خاطئ: ε لا تُضاف للمكدس.

---

### السؤال 7 (hard) — سيناريو تتبع
بالمدخل `a+b$` والقواعد المُعطاة، ما هي أول عملية يقوم بها المحلل إذا كان Stack = `[E, $]` وأول رمز في المدخل `a` (أي Id)؟

أ) pop(E)، push(`$`)
ب) استشر M[E, Id] = `E → TE1`؛ pop(E)؛ push(E1, T)
ج) قراءة `a` من المدخل وتقدم المؤشر
د) إبلاغ عن خطأ لأن E لا يطابق `a`

**الإجابة الصحيحة: ب**
**التعليل:**
- E هو Nonterminal → نستشير الجدول M[E, Id].
- M[E, Id] = `E → TE1` → pop(E)؛ ادفع E1 أولاً ثم T (ليكون T في القمة).
- **أ** خاطئ: لا نضع `$` في المكدس هكذا.
- **ج** خاطئ: لا نقرأ المدخل عند معالجة Nonterminal.
- **د** خاطئ: E ليس Terminal لنطابقه مباشرة.

---

### السؤال 8 (medium) — مقارنة
أيّ من المحللات التالية هو `Bottom-Up`؟

أ) `LL(1) Parser`
ب) `Recursive Descent Parser`
ج) `Predictive Parser`
د) `Shift-Reduce Parser`

**الإجابة الصحيحة: د**
**التعليل:**
- **أ** خاطئ: LL(1) هو Top-Down.
- **ب** خاطئ: Recursive Descent هو Top-Down.
- **ج** خاطئ: Predictive Parsing هو Top-Down.
- **د** صحيح: Shift-Reduce (LR Parsing) هو Bottom-Up.

---

### السؤال 9 (hard) — تطبيق
بالقواعد `S → cAd`، `A → ab | a`، `W=cad`، ما خطوات `Recursive Descent with Backtracking`؟

أ) `S → cAd → cabd → فشل → S → cAd → cad ✓`
ب) `S → cAd → cad ✓` (مباشرة بدون Backtrack)
ج) `S → cAd → cabd → cad → S ✓`
د) `S → فشل → A → ab → cabd → ✓`

**الإجابة الصحيحة: أ**
**التعليل:**
- نجرب `A → ab` أولاً → نحصل على `cabd` لكن المدخل `cad` → `b` لا يطابق → **Backtrack**.
- نجرب `A → a` → نحصل على `cad` → يطابق ✓.
- **ب** خاطئ: هذا يُظهر Backtracking وليس تطابقاً مباشراً.
- **ج** خاطئ: لا توجد خطوة `cabd → cad` في الاشتقاق.
- **د** خاطئ: الترتيب خاطئ.

---

### السؤال 10 (hard) — تتبع Follow
بالقاعدة `E → TE1`، `E1 → +TE1 | ε`، لماذا `Follow(E1) = Follow(E)`؟

أ) لأن E1 يظهر دائماً في بداية القواعد
ب) لأن `E → TE1` وE1 في نهاية يمين القاعدة → ما يأتي بعد E1 هو ما يأتي بعد E
ج) لأن First(E1) = First(E)
د) لأن E1 تُشتق من E مباشرة

**الإجابة الصحيحة: ب**
**التعليل:**
- في `E → TE1`: E1 هي آخر رمز في يمين القاعدة → لا يوجد رمز يليها في هذه القاعدة.
- وفقاً لقاعدة Follow: `Follow(E1) ⊇ Follow(E)` (الجانب الأيسر).
- **أ** خاطئ: E1 في النهاية وليس البداية.
- **ج** خاطئ: First(E) ≠ First(E1) تماماً.
- **د** خاطئ: E1 ليست مشتقة من E — E يشتق إلى TE1.

---

### السؤال 11 (medium) — نظري
ما الغرض من `$` (علامة نهاية المدخل) في `Predictive Parser`؟

أ) تُستخدم كـTerminal في قواعد النحو
ب) تُضاف لقاع Stack وللمدخل لتحديد نهاية التحليل والتحقق من القبول
ج) تُضاف فقط للمدخل لتأمين عدم تجاوزه
د) تُستخدم كـNonterminal في جدول M

**الإجابة الصحيحة: ب**
**التعليل:**
- `$` في قاع Stack وفي نهاية المدخل يضمن التزامن: عندما كلاهما `$` في القمة/المؤشر → قبول.
- **أ** خاطئ: `$` ليست في القواعد الأصلية.
- **ج** خاطئ: يجب أن تكون أيضاً في قاع Stack.
- **د** خاطئ: `$` Terminal وليس Nonterminal.

---

### السؤال 12 (hard) — سيناريو كود
إذا كانت لديك القاعدة `A → αβ | αγ` (تبدأ كلتاهما بـα)، ما المشكلة وما الحل؟

أ) لا توجد مشكلة — الجدول يتعامل معهما
ب) مشكلة Ambiguity — الحل إزالة الغموض
ج) تعارض في جدول LL(1) — الحل Left Factoring: `A → α A'`، `A' → β | γ`
د) مشكلة Left Recursion — الحل إزالة العودية اليسرى

**الإجابة الصحيحة: ج**
**التعليل:**
- كلا القاعدتين تشتركان في prefix α → `First(αβ) ∩ First(αγ) ≠ ∅` → تعارض في جدول M.
- الحل: Left Factoring — استخرج α مشتركة: `A → α A'`، `A' → β | γ`.
- **أ** خاطئ: يوجد تعارض حقيقي.
- **ب** خاطئ: ليست Ambiguity بالضرورة، بل مشكلة LL(1).
- **د** خاطئ: ليست عودية يسرى — α ليست A.

---

### السؤال 13 (hard) — تتبع خوارزمية حساب Follow
بالقاعدة `T → FT1`: لماذا `Follow(F) ⊇ First(T1) - {ε}`؟

أ) لأن F يظهر في نهاية القاعدة
ب) لأن T1 تأتي مباشرة بعد F في القاعدة → ما يأتي بعد F هو ما يبدأ به T1
ج) لأن Follow(F) = Follow(T)
د) لأن First(F) يحتوي First(T1)

**الإجابة الصحيحة: ب**
**التعليل:**
- في `T → FT1`: F تليها T1 → ما يبدأ به T1 (أي First(T1)) هو ما قد يظهر بعد F.
- نستثني ε من First(T1) ونضيفها للـFollow مباشرة.
- **أ** خاطئ: F ليست في النهاية — T1 هي في النهاية.
- **ج** خاطئ: `Follow(F) ⊇ Follow(T)` فقط إذا كانت T1 → ε ممكنة.
- **د** خاطئ: العلاقة بين Follow(F) وFirst(T1)، ليس First(F).

---

### السؤال 14 (medium) — مقارنة
أيّ خاصية تُميّز `Bottom-Up Parsing` عن `Top-Down Parsing`؟

أ) يستخدم Leftmost Derivation
ب) يبني شجرة الاشتقاق من الجذر
ج) يستخدم عكس Rightmost Derivation ويبدأ من الأوراق
د) يتطلب Left Factoring للعمل

**الإجابة الصحيحة: ج**
**التعليل:**
- **أ** خاطئ: Bottom-Up يستخدم (عكس) Rightmost.
- **ب** خاطئ: هذا Top-Down.
- **ج** صحيح: Bottom-Up يبدأ من الرموز الطرفية ويختزل (Reduce) إلى رمز البداية.
- **د** خاطئ: Left Factoring متطلب لـPredictive Parsing (Top-Down).

---

### السؤال 15 (hard) — سيناريو كود
إذا كانت قمة Stack = `T` والرمز الحالي في المدخل = `)` في جدول M المُعطى، ماذا يحدث؟

أ) يُقبل لأن `)` في Follow(T)
ب) خطأ لأن M[T, )] فارغة
ج) يُطبَّق `T → FT1` لأن `)`  في First(T)
د) يُطبَّق `T → ε` لأن `)` في Follow(T)

**الإجابة الصحيحة: ب**
**التعليل:**
- من الجدول: M[T, )] فارغة → خطأ نحوي.
- **أ** خاطئ: Follow لا يملأ خلايا T — T ليس له قاعدة ε.
- **ج** خاطئ: `)` ليس في First(T) = {(, Id}.
- **د** خاطئ: `T → ε` غير موجودة في هذه القواعد.

---

### السؤال 16 (hard) — سيناريو كود
بالقواعد: `E → TE1`، حُسب `First(E) = {(, Id}` و`Follow(E) = {), $}`. أيّ خلايا جدول M تُملأ من هذه المعلومات؟

أ) M[E, (] و M[E, Id] فقط
ب) M[E, (] و M[E, Id] و M[E, )] و M[E, $]
ج) M[E, )] و M[E, $] فقط
د) M[E, (] و M[E, Id] و M[E, ε]

**الإجابة الصحيحة: أ**
**التعليل:**
- القاعدة `E → TE1`: ε ∉ First(TE1) → نستخدم First فقط.
- First(E → TE1) = First(T) = {(, Id} → M[E,(] و M[E,Id] = `E → TE1`.
- لا نستخدم Follow لأن E ليس له قاعدة ε.
- **ب** خاطئ: `)` و`$` تُستخدم فقط عند E → ε وهي غير موجودة.
- **ج** خاطئ: هذا عكس الصحيح.
- **د** خاطئ: لا توجد خلية ε في جدول M.

---

### السؤال 17 (medium) — تطبيق
ما نتيجة `Reduce` في `Shift-Reduce Parsing` للمثال `cabd` بالقواعد `S → cAd`، `A → ab`؟

أ) `cabd → cAd → S` باستخدام قاعدتَي Reduce
ب) `cabd → cabd` (لا يتغير)
ج) `cabd → S → cAd`
د) `S → cAd → cabd`

**الإجابة الصحيحة: أ**
**التعليل:**
- أولاً: `ab` يُختزل إلى `A` (باستخدام `A → ab`) → `cAd`.
- ثانياً: `cAd` يُختزل إلى `S` (باستخدام `S → cAd`).
- **ب** خاطئ: يحدث اختزال.
- **ج** و**د** خاطئان: الترتيب معكوس (هذا اشتقاق وليس اختزالاً).

---

### السؤال 18 (hard) — تتبع شامل

**السيناريو:**
القواعد: `E → TE1`، `E1 → +TE1 | ε`، `T → FT1`، `T1 → *FT1 | ε`، `F → Id`
المدخل: `Id+Id$`
Stack الابتدائي: `[E, $]`

بعد الخطوات الأولى يصبح Stack = `[F, T1, E1, $]` والمدخل = `Id+Id$`. ما الخطوة التالية؟

أ) استشر M[F, Id] = `F → Id` → pop(F)؛ push(Id)
ب) قراءة Id من المدخل لأن F = Id
ج) استشر M[F, Id] = `F → Id` → pop(F)؛ push(Id)؛ ثم pop(Id) وتقدم في المدخل
د) خطأ لأن F ليس في أعلى المكدس

**الإجابة الصحيحة: ج**
**التعليل:**
- F هو Nonterminal → استشر M[F, Id] = `F → Id`.
- pop(F)؛ push(Id) → الآن قمة Stack = `Id`.
- Id هو Terminal ويطابق أول رمز في المدخل (Id) → pop(Id)؛ تقدم في المدخل.
- **أ** خاطئ: ينسى الخطوة الثانية (مطابقة Id).
- **ب** خاطئ: F هو Nonterminal لا Terminal.
- **د** خاطئ: F بالفعل في القمة.

---

## الجزء الرابع: أسئلة تصحيح القواعد والاشتقاقات

### سؤال تصحيح 1 — `wrong_derivation`

**القاعدة/الاشتقاق التالي يحتوي خطأ:**
```text
(Leftmost) E ⇒ –E ⇒ –(E) ⇒ –(E+E) ⇒ –(E+Id) ⇒ –(Id+Id)
```
**اكتشف الخطأ:** هذا اشتقاق Rightmost وليس Leftmost! في الخطوة 4، استُبدلت E اليمنى (`E → Id`) وليس اليسرى.

**التصحيح:**
```text
(Leftmost) E ⇒ –E ⇒ –(E) ⇒ –(E+E) ⇒ –(Id+E) ⇒ –(Id+Id)
```
**شرح الحل:**
1. في `–(E+E)`: أقصى E يساراً هي E الأولى (قبل +).
2. Leftmost تستبدل دائماً أقصى Nonterminal **يساراً**.
3. الخطأ الشائع هو الخلط بين Leftmost وRightmost عند وجود أكثر من Nonterminal.

---

### سؤال تصحيح 2 — `left_recursion`

**القاعدة/الاشتقاق التالي يحتوي خطأ:**
```text
Grammar: E → E + T | T
Claim: هذه القواعد مناسبة لـPredictive Parsing مباشرة
```
**اكتشف الخطأ:** القاعدة `E → E + T` هي عودية يسرى (`Left Recursive`) — E تبدأ بـE نفسها. هذا يسبب حلقة لا نهائية في `Recursive Descent`/`Predictive Parsing`.

**التصحيح:**
```text
بعد إزالة Left Recursion:
E  → T E1
E1 → + T E1 | ε
```
**شرح الحل:**
1. القاعدة `A → Aα | β` تُحوَّل إلى `A → β A'` و `A' → α A' | ε`.
2. هنا `A=E`، `α=+T`، `β=T`.
3. النتيجة `E → T E1`، `E1 → +T E1 | ε`.

---

### سؤال تصحيح 3 — `wrong_formula`

**القاعدة/الاشتقاق التالي يحتوي خطأ:**
```text
Follow(E1) = First(E) = {(, Id}
```
**اكتشف الخطأ:** `Follow(E1) ≠ First(E)`. Follow و First مفهومان مختلفان تماماً. Follow(E1) يُحسب من سياق ظهور E1 في القواعد.

**التصحيح:**
```text
Follow(E1) = Follow(E) = {), $}
```
**شرح الحل:**
1. في `E → TE1`: E1 في نهاية اليمين → `Follow(E1) ⊇ Follow(E)`.
2. `Follow(E) = {), $}` (E هي Start Symbol تتبعها `)` من `F → (E)` ونهاية المدخل `$`).
3. Follow دائماً يحتوي Terminals أو `$`، أبداً `ε`.

---

### سؤال تصحيح 4 — `ambiguous_grammar`

**القاعدة/الاشتقاق التالي يحتوي خطأ:**
```text
Grammar: E → E + E | E * E | Id
Claim: يمكن بناء جدول LL(1) لهذه القواعد مباشرة
```
**اكتشف الخطأ:** هذه القواعد **غامضة** (`Ambiguous`) وبها Left Recursion. سيحدث تعارض في جدول M: مثلاً M[E,+] ستحتوي أكثر من قاعدة.

**التصحيح:**
```text
بعد إزالة Ambiguity والـLeft Recursion:
E  → T E1
E1 → + T E1 | ε
T  → F T1
T1 → * F T1 | ε
F  → Id
```
**شرح الحل:**
1. الغموض يُزال بتحديد الأولوية: `*` له أولوية أعلى من `+`.
2. Left Recursion تُزال بالتحويل الموضّح أعلاه.
3. الآن يمكن بناء جدول LL(1) بلا تعارض.

---

### سؤال تصحيح 5 — `misconception`

**القاعدة/الاشتقاق التالي يحتوي خطأ:**
```text
عند ملء جدول M:
For E1 → ε: M[E1, a] = E1 → ε for each a in First(E1)
```
**اكتشف الخطأ:** عند القاعدة `X → ε`، يجب استخدام **`Follow(X)`** وليس `First(X)` (أو First(ε) = {ε}).

**التصحيح:**
```text
For E1 → ε: M[E1, b] = E1 → ε for each b in Follow(E1)
i.e. M[E1, )] = E1 → ε and M[E1, $] = E1 → ε
```
**شرح الحل:**
1. عند رؤية قاعدة X → ε: نريد معرفة "متى نطبّق الإختفاء؟" — عندما يظهر رمز من Follow(X).
2. `Follow(E1) = {), $}` → نضع `E1 → ε` في M[E1,)] و M[E1,$].
3. الخلط الشائع: استخدام First بدلاً من Follow عند قواعد ε.

---

## الجزء الرابع: تمارين إضافية (من إعداد الدليل للتدريب)

> **هذه تمارين إضافية من إعداد الدليل للتدريب** — ليست في المحاضرة الأصلية.

### تمرين 1: حساب First — `first_follow_calc`

**السيناريو / المطلوب:**
القواعد: `S → A B C`، `A → a | ε`، `B → b | ε`، `C → c`

**المطلوب:**
1. احسب First(A)، First(B)، First(C)، First(S).
2. لماذا First(S) يحتوي على `a` و`b` و`c`؟

**نموذج الحل:**
1. `First(A) = {a, ε}` (A → a أو A → ε)
2. `First(B) = {b, ε}` (B → b أو B → ε)
3. `First(C) = {c}` (C → c فقط)
4. `First(S) = First(A) - {ε} = {a}`. بما أن `ε ∈ First(A)` → أضف `First(B) - {ε} = {b}`. بما أن `ε ∈ First(B)` → أضف `First(C) = {c}`. بما أن `ε ∉ First(C)` → نتوقف.
5. **النتيجة:** `First(S) = {a, b, c}`.
6. السبب: إذا كانت A فارغة يمكن أن نرى `b` أولاً؛ وإذا كانت A وB فارغتين نرى `c` أولاً.

---

### تمرين 2: حساب Follow — `first_follow_calc`

**السيناريو / المطلوب:**
القواعد: `S → A B C`، `A → a | ε`، `B → b | ε`، `C → c` (نفس التمرين السابق)

**المطلوب:**
1. احسب Follow(A)، Follow(B)، Follow(C).

**نموذج الحل:**
1. `Follow(A)`: في `S → ABC`، بعد A يأتي BC. `First(BC) - {ε} = First(B) - {ε} = {b}`. بما أن `ε ∈ First(B)` → أضف `First(C) = {c}`. بما أن `ε ∉ First(C)` → نتوقف. **Follow(A) = {b, c}**.
2. `Follow(B)`: في `S → ABC`، بعد B يأتي C. `First(C) = {c}` → **Follow(B) = {c}**.
3. `Follow(C)`: C في نهاية S → `Follow(C) ⊇ Follow(S) = {$}` → **Follow(C) = {$}**.

---

### تمرين 3: Left Factoring — `grammar_transform`

**السيناريو / المطلوب:**
القواعد: `A → if E then S else S | if E then S`

**المطلوب:**
1. ما المشكلة في هذه القواعد لـLL(1)؟
2. طبّق Left Factoring.

**نموذج الحل:**
1. **المشكلة:** كلتا القاعدتين تبدآن بـ`if` → `First(if E then S else S) ∩ First(if E then S) = {if} ≠ ∅` → تعارض في الجدول.
2. **بعد Left Factoring:**
   ```
   A  → if E then S A'
   A' → else S | ε
   ```
3. الآن عند رؤية `if` نطبق قاعدة واحدة فقط. إذا جاء `else` بعدها نطبق `A' → else S`، وإلا `A' → ε`.

---

### تمرين 4: ملء جدول LL(1) — `table_fill`

**السيناريو / المطلوب:**
القواعد: `S → aS | b`
`First(S) = {a, b}`، `Follow(S) = {$}`

**المطلوب:**
1. ابنِ جدول M لهذه القواعد.

**نموذج الحل:**

| | `a` | `b` | `$` |
| --- | --- | --- | --- |
| **S** | `S → aS` | `S → b` | (خطأ) |

**التفسير:**
- `S → aS`: أول رمز `a` → M[S,a] = `S → aS`.
- `S → b`: أول رمز `b` → M[S,b] = `S → b`.
- لا قاعدة ε → لا نستخدم Follow.

---

### تمرين 5: تحليل Bottom-Up — `scenario`

**السيناريو / المطلوب:**
القواعد: `S → cAd`، `A → ab | a`، `W = cabd`

**المطلوب:**
1. أظهر خطوات Bottom-Up Parsing (الاختزال).
2. ما القاعدة التي استُخدمت في كل خطوة؟

**نموذج الحل:**
1. `cabd` → الإدخال الكامل.
2. نحدد `ab` داخل السلسلة وهو يطابق `A → ab` → `cabd` يصبح `cAd`.
3. `cAd` يطابق `S → cAd` → يصبح `S` ✓.
4. تسلسل الاختزالات: `cabd` ⇒ `cAd` ⇒ `S`.

---

### تمرين 6: تتبع Predictive Parser — `scenario`

**السيناريو / المطلوب:**
القواعد: `E → TE1`، `E1 → +TE1 | ε`، `T → FT1`، `T1 → *FT1 | ε`، `F → Id`
المدخل: `Id$`

**المطلوب:**
1. تتبع خطوات المحلل خطوة بخطوة (Stack + Input + Action).

**نموذج الحل:**

| Stack | Input | Action |
| --- | --- | --- |
| `E $` | `Id $` | M[E,Id] = E→TE1 → pop(E), push(E1,T) |
| `T E1 $` | `Id $` | M[T,Id] = T→FT1 → pop(T), push(T1,F) |
| `F T1 E1 $` | `Id $` | M[F,Id] = F→Id → pop(F), push(Id) |
| `Id T1 E1 $` | `Id $` | top=Id=Input[0] → pop(Id), advance |
| `T1 E1 $` | `$` | M[T1,$] = T1→ε → pop(T1) |
| `E1 $` | `$` | M[E1,$] = E1→ε → pop(E1) |
| `$` | `$` | **ACCEPT** ✓ |

---

### تمرين 7: First & Follow — `first_follow_calc`

**السيناريو / المطلوب:**
القواعد: `A → BCD`، `B → b | ε`، `C → c | ε`، `D → d`

**المطلوب:** احسب Follow(B) و Follow(C).

**نموذج الحل:**
- **Follow(B):** بعد B في `A → BCD` يأتي CD. `First(C) - {ε} = {c}`. بما أن `ε ∈ First(C)` → أضف `First(D) = {d}`. **Follow(B) = {c, d}**.
- **Follow(C):** بعد C في `A → BCD` يأتي D. `First(D) = {d}` → أضف. **Follow(C) = {d}**.

---

## الجزء الرابع: تمارين تحليل وتطبيق

> تمارين تحليلية إضافية — بناء جداول تحليل، سيناريوهات، ملء مخططات.

### تمرين 1: بناء جدول LL(1) كامل — `parse_table_construction`

**السيناريو:**
```
E  → TE1
E1 → +TE1 | ε
T  → FT1
T1 → *FT1 | ε
F  → (E) | Id
```

**المطلوب:**
1. احسب First وFollow لكل Nonterminal.
2. ابنِ جدول M الكامل.

**نموذج الحل:**

**First:**
| النتغير | First |
| --- | --- |
| F | {(, Id} |
| T | {(, Id} |
| T1 | {*, ε} |
| E | {(, Id} |
| E1 | {+, ε} |

**Follow:**
| المتغير | Follow |
| --- | --- |
| E | {), $} |
| E1 | {), $} |
| T | {+, ), $} |
| T1 | {+, ), $} |
| F | {+, *, ), $} |

**جدول M:**

| | Id | + | * | ( | ) | $ |
| --- | --- | --- | --- | --- | --- | --- |
| E | E→TE1 | | | E→TE1 | | |
| E1 | | E1→+TE1 | | | E1→ε | E1→ε |
| T | T→FT1 | | | T→FT1 | | |
| T1 | | T1→ε | T1→*FT1 | | T1→ε | T1→ε |
| F | F→Id | | | F→(E) | | |

---

### تمرين 2: مقارنة Bottom-Up وTop-Down لمثال — `case_study`

**السيناريو:** القواعد `S → cAd`، `A → ab | a`، `W = cad`

**المطلوب:**
1. أظهر Top-Down (Recursive Descent) مع Backtracking.
2. أظهر Bottom-Up (Shift-Reduce).
3. قارن عدد الخطوات.

**نموذج الحل:**

**Top-Down:** `S → cAd → c[A→ab]d = cabd ✗ (Backtrack) → c[A→a]d = cad ✓` — 4 خطوات + backtrack.

**Bottom-Up:** `cad → c[A←a]d = cAd → [S←cAd] = S ✓` — 3 خطوات بدون backtrack.

**المقارنة:** Bottom-Up أكفأ هنا لأنه لا يتراجع. لكن Top-Down أسهل فهماً وتطبيقاً يدوياً.

---

### تمرين 3: تشخيص تعارض LL(1) — `written_analysis`

**السيناريو:**
```
S → iEtS | iEtSeS | a
E → b
```

**المطلوب:** هل هذه القواعد LL(1)؟ اشرح لماذا.

**نموذج الحل:**
- `First(iEtS) = {i}` و `First(iEtSeS) = {i}`.
- `First(iEtS) ∩ First(iEtSeS) = {i} ≠ ∅` → **تعارض في M[S,i]**.
- **ليست LL(1)** — هذه هي مشكلة `Dangling Else` الكلاسيكية.
- الحل: استخدام Left Factoring أو تبنّي اصطلاح "else ينتمي لأقرب if".

---

## الجزء الرابع: تمارين تتبع التنفيذ

### تمرين تتبع 1: Leftmost Derivation — `derivation_steps`

**المدخل:**
```text
القواعد: E → E+E | Id، المطلوب: اشتقاق Id+Id+Id (Leftmost)
```

**تتبّع خطوة بخطوة (أكمل الجدول):**
| الخطوة | العملية | الحالة الحالية |
| --- | --- | --- |
| 0 | ابدأ | `E` |
| 1 | ؟ | ؟ |
| 2 | ؟ | ؟ |
| 3 | ؟ | ؟ |
| 4 | ؟ | ؟ |
| 5 | ؟ | ؟ |

**نموذج الحل:**
| الخطوة | العملية | الحالة الحالية |
| --- | --- | --- |
| 0 | — | `E` |
| 1 | `E → E+E` | `E+E` |
| 2 | `E → E+E` (على E اليسرى) | `E+E+E` |
| 3 | `E → Id` (على E أقصى يساراً) | `Id+E+E` |
| 4 | `E → Id` (على E الوسطى) | `Id+Id+E` |
| 5 | `E → Id` (على E اليمنى) | `Id+Id+Id` ✓ |

**النتيجة:** اشتقاق Leftmost في 5 خطوات.

---

### تمرين تتبع 2: Predictive Parser — `parse_stack_trace`

**المدخل:**
```text
Grammar: E → TE1, E1 → +TE1 | ε, T → FT1, T1 → *FT1 | ε, F → Id
Input: Id+Id$
```

**تتبّع (أكمل الجدول):**
| Stack | Input | Action |
| --- | --- | --- |
| `E $` | `Id+Id$` | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |

**نموذج الحل:**
| Stack | Input | Action |
| --- | --- | --- |
| `E $` | `Id+Id$` | M[E,Id]=E→TE1 → push(E1,T) |
| `T E1 $` | `Id+Id$` | M[T,Id]=T→FT1 → push(T1,F) |
| `F T1 E1 $` | `Id+Id$` | M[F,Id]=F→Id → push(Id) |
| `Id T1 E1 $` | `Id+Id$` | top=Id=input → pop, advance |
| `T1 E1 $` | `+Id$` | M[T1,+]=T1→ε → pop(T1) |
| `E1 $` | `+Id$` | M[E1,+]=E1→+TE1 → push(E1,T,+) |
| `+ T E1 $` | `+Id$` | top=+=input → pop, advance |
| `T E1 $` | `Id$` | M[T,Id]=T→FT1 → push(T1,F) |
| `F T1 E1 $` | `Id$` | M[F,Id]=F→Id → push(Id) |
| `Id T1 E1 $` | `Id$` | top=Id=input → pop, advance |
| `T1 E1 $` | `$` | M[T1,$]=T1→ε → pop |
| `E1 $` | `$` | M[E1,$]=E1→ε → pop |
| `$` | `$` | **ACCEPT** ✓ |

**النتيجة:** قبول `Id+Id`.

---

### تمرين تتبع 3: Bottom-Up Shift-Reduce — `parse_stack_trace`

**المدخل:**
```text
S → cAd, A → ab | a, W = cabd
```

**تتبّع (أكمل):**
| Stack | Input المتبقي | Action |
| --- | --- | --- |
| `[]` | `cabd$` | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |
| ؟ | ؟ | ؟ |

**نموذج الحل:**
| Stack | Input المتبقي | Action |
| --- | --- | --- |
| `[]` | `cabd$` | Shift(c) |
| `[c]` | `abd$` | Shift(a) |
| `[c,a]` | `bd$` | Shift(b) |
| `[c,a,b]` | `d$` | Reduce: ab→A |
| `[c,A]` | `d$` | Shift(d) |
| `[c,A,d]` | `$` | Reduce: cAd→S |
| `[S]` | `$` | **ACCEPT** ✓ |

**النتيجة:** قبول `cabd`.

---

### تمرين تتبع 4: حساب Follow خطوة بخطوة — `derivation_steps`

**المدخل:**
```text
E → TE1, E1 → +TE1 | ε, T → FT1, T1 → *FT1 | ε, F → (E) | Id
```

**أكمل جدول Follow:**
| المتغير | الخطوات | Follow |
| --- | --- | --- |
| E | ؟ | ؟ |
| E1 | ؟ | ؟ |
| T | ؟ | ؟ |
| T1 | ؟ | ؟ |
| F | ؟ | ؟ |

**نموذج الحل:**
| المتغير | الخطوات | Follow |
| --- | --- | --- |
| E | (1) Start Symbol → `$`; (2) `F→(E)` → `)` بعد E | `{), $}` |
| E1 | `E→TE1` وE1 في النهاية → Follow(E) | `{), $}` |
| T | `E→TE1` → First(E1)-{ε}={+}, وε∈First(E1) → Follow(E) | `{+, ), $}` |
| T1 | `T→FT1` وT1 في النهاية → Follow(T) | `{+, ), $}` |
| F | `T→FT1` → First(T1)-{ε}={*}, وε∈First(T1) → Follow(T) | `{+, *, ), $}` |

---

### تمرين تتبع 5: Recursive Descent Backtracking — `parse_stack_trace`

**المدخل:**
```text
S → AB, A → aA | ε, B → b | ε, W = ab
```

**أكمل شجرة الاشتقاق:**
| الخطوة | التوسع | الحالة |
| --- | --- | --- |
| 1 | `S → AB` | ؟ |
| 2 | ؟ | ؟ |
| 3 | ؟ | ؟ |
| 4 | ؟ | ؟ |

**نموذج الحل:**
| الخطوة | التوسع | الحالة |
| --- | --- | --- |
| 1 | `S → AB` | يحتاج A ثم B |
| 2 | `A → aA` (أول بديل) | نقرأ `a` ✓، الآن يحتاج A |
| 3 | `A → ε` | A تختفي، الآن يحتاج B |
| 4 | `B → b` | نقرأ `b` ✓ |

**النتيجة:** قبول `ab` بدون backtracking لأن `aA` يطابق.

---

## الجزء الخامس: أسئلة نظرية متوقعة بالامتحان

### السؤال 1: ما هو `Parsing` وما هدفه في المترجم؟
**نموذج الإجابة:**
1. **التعريف:** `Parsing` هو عملية التحقق من أن سلسلة رموز (`Token Stream`) تنتمي للغة المعرّفة بـ`CFG` وبناء شجرة الاشتقاق (`Parse Tree`).
2. **المكونات:** `CFG`، `Token Stream`، `Parse Tree`، `Error Reporting`.
3. **مثال:** التحقق من أن `Id + Id * Id` جملة صحيحة في قواعد التعابير الحسابية.
4. **متى نستخدم:** المرحلة الثانية من مراحل المترجم، بعد `Lexical Analysis`.

---

### السؤال 2: ما الفرق بين `Leftmost` و`Rightmost Derivation`؟ متى يُستخدم كل منهما؟
**نموذج الإجابة:**
1. **التعريف:** `Leftmost` يستبدل أقصى Nonterminal يساراً، `Rightmost` يستبدل أقصى Nonterminal يميناً.
2. **الاستخدام:** `Top-Down Parsers` تستخدم `Leftmost`، `Bottom-Up Parsers` تستخدم عكس `Rightmost`.
3. **مثال:** اشتقاق `–(Id+Id)` يختلف ترتيب الخطوات بين النوعين.
4. **متى نفضل أيهما:** يعتمد على نوع المحلل المستخدم.

---

### السؤال 3: اشرح `Top-Down Parsing` وأنواعه.
**نموذج الإجابة:**
1. **التعريف:** يبني شجرة الاشتقاق من الجذر (`Start Symbol`) نزولاً نحو الأوراق (`Terminals`).
2. **الأنواع:**
   - `Recursive Descent`: يستخدم دوالاً متبادلة العودية، قد يستخدم `Backtracking`.
   - `Predictive Parsing`: لا يستخدم `Backtracking`، يعتمد على جدول M، يتطلب Left Factoring وإزالة Left Recursion.
3. **مثال:** محلل `LL(1)` هو نوع Predictive.
4. **متى نستخدمه:** للقواعد البسيطة أو عندما نكتب المحلل يدوياً.

---

### السؤال 4: ما هو `Bottom-Up Parsing`؟ كيف يعمل `Shift-Reduce`؟
**نموذج الإجابة:**
1. **التعريف:** يبني الشجرة من الأوراق صاعداً نحو الجذر باختزال السلاسل إلى Nonterminals.
2. **المكونات:** `Stack`، `Input Buffer`، جدول أفعال (`Action/Goto`).
3. **العمليات:** `Shift` = نقل رمز من المدخل إلى المكدس، `Reduce` = استبدال قمة المكدس بـNonterminal.
4. **متى نستخدمه:** أقوى من Top-Down، يُستخدم في أدوات توليد المحللات كـ`yacc`/`bison`.

---

### السؤال 5: ما هو `First(X)`؟ كيف يُحسب؟
**نموذج الإجابة:**
1. **التعريف:** مجموعة كل Terminals التي يمكن أن تبدأ بها أي سلسلة مشتقة من X، بالإضافة إلى `ε` إذا كان X يمكن أن يشتق إلى ε.
2. **المكونات:** إذا X Terminal → `First(X)={X}`. إذا X → ε → أضف `ε`. إذا X → Y1Y2...Yk → أضف First(Y1), وإذا Y1→ε أضف First(Y2) إلخ.
3. **مثال:** `First(E1) = {+, ε}` لأن `E1 → +TE1 | ε`.
4. **متى نستخدمه:** لملء جدول LL(1).

---

### السؤال 6: ما هو `Follow(X)`؟ كيف يُحسب؟
**نموذج الإجابة:**
1. **التعريف:** مجموعة Terminals التي يمكن أن تظهر مباشرة بعد X في أي اشتقاق من Start Symbol.
2. **قواعد الحساب:** `$` دائماً في Follow(Start Symbol). في `A → αBβ`: أضف First(β)-{ε} لـFollow(B)، وإذا ε∈First(β) أضف Follow(A). في `A → αB`: أضف Follow(A) لـFollow(B).
3. **مثال:** `Follow(E) = {), $}`.
4. **متى نستخدمه:** فقط عند قواعد X → ε لملء جدول LL(1).

---

### السؤال 7: ما شروط `Predictive Parsing`؟ ما هو LL(1)؟
**نموذج الإجابة:**
1. **التعريف:** LL(1) = Left-to-right scan, Leftmost derivation, 1 symbol lookahead.
2. **الشروط:** لا Left Recursion، قواعد Left Factored، لكل Nonterminal X: إذا X → α | β فيجب `First(α) ∩ First(β) = ∅`، وإذا كان ε ممكناً فـ`First(α) ∩ Follow(X) = ∅`.
3. **مثال:** قواعد if/while/begin LL(1) لأن كل قاعدة تبدأ بكلمة محجوزة مختلفة.
4. **متى نستخدمه:** عند رغبتنا في محلل فعّال بدون backtracking.

---

### السؤال 8: ما هي مشكلة `Left Recursion`؟ كيف نحلّها؟
**نموذج الإجابة:**
1. **التعريف:** قاعدة Left Recursive هي `A → Aα | β` — A تبدأ بنفسها.
2. **المشكلة:** في Recursive Descent تسبب حلقة لا نهائية؛ لا يمكن بناء جدول LL(1).
3. **الحل:**
   ```
   A → Aα | β  يصبح:
   A  → β A'
   A' → α A' | ε
   ```
4. **متى نواجهها:** مع قواعد التعابير الحسابية الطبيعية مثل `E → E+T`.

---

### السؤال 9: ما هو `Left Factoring`؟ متى يكون ضرورياً؟
**نموذج الإجابة:**
1. **التعريف:** استخراج البادئة المشتركة من قواعد بديلة لـNonterminal واحد.
2. **المكونات:** `A → αβ | αγ` يصبح `A → α A'`، `A' → β | γ`.
3. **مثال:** `if E then S | if E then S else S` يصبح `if E then S A'`، `A' → else S | ε`.
4. **متى:** ضروري عند بناء جدول LL(1) إذا كانت هناك بادئات مشتركة.

---

### السؤال 10: كيف يُبنى جدول LL(1)؟ اشرح الخوارزمية.
**نموذج الإجابة:**
1. **التعريف:** جدول M[X,a] يحدد أي قاعدة إنتاج تُطبَّق عند وجود Nonterminal X في قمة المكدس والرمز الحالي a في المدخل.
2. **الخوارزمية:**
   - لكل `X → α`: احسب First(α). لكل a في First(α): `M[X,a] = X → α`.
   - إذا ε ∈ First(α): لكل b في Follow(X): `M[X,b] = X → α`.
3. **مثال:** `M[E,Id] = E → TE1` لأن Id ∈ First(TE1) = First(T) = {(,Id}.
4. **متى نستخدمه:** مرحلة بناء المحلل قبل التحليل الفعلي.

---

### السؤال 11: ما هو دور الـ`Stack` في `Non-Recursive Predictive Parser`؟
**نموذج الإجابة:**
1. **التعريف:** المكدس يحمل الرموز (Terminals وNonterminals) التي نتوقع رؤيتها في بقية المدخل.
2. **التهيئة:** `[$, Start Symbol]` (Start Symbol في القمة، $ في القاع).
3. **العمليات:** إذا قمة = Nonterminal → استشر M. إذا قمة = Terminal → طابقه مع المدخل وpop+advance. إذا كلاهما `$` → قبول.
4. **متى:** طوال عملية التحليل.

---

## الجزء السادس: ورقة المراجعة السريعة (Cheat Sheet)

### 🔑 خريطة العلاقات بين المحاضرات

| المحاضرة | ترتبط مع | كيف؟ |
| --- | --- | --- |
| Lexical Analysis | هذه المحاضرة | تُغذّي Token Stream للمحلل النحوي |
| Syntax Analysis (هذه) | Semantic Analysis | تُنتج Parse Tree للتحليل الدلالي |
| CFG & Formal Languages | هذه المحاضرة | أساس نظري لـParsing |
| LL(1) Tables | LR Parsing (محاضرة لاحقة) | كلاهما يبني جداول تحليل |

### 🔑 أهم النقاط الذهبية

| الموضوع | النقاط |
| --- | --- |
| Leftmost | استبدل أقصى Nonterminal يساراً — Top-Down |
| Rightmost | استبدل أقصى Nonterminal يميناً — (عكسه) Bottom-Up |
| Predictive | يتطلب: No Left Recursion + Left Factored |
| First(X) | رموز بداية اشتقاق X، يشمل ε إذا X→ε |
| Follow(X) | رموز تأتي بعد X، لا يشمل ε أبداً |
| جدول M | لكل X→α: ملء من First(α)؛ إذا ε∈First(α): ملء من Follow(X) |
| Bottom-Up | Shift+Reduce، أقوى من Top-Down |

### 🔑 مرجع سريع

| الرمز/المصطلح | المعنى | يُستخدم في |
| --- | --- | --- |
| `⇒` | خطوة اشتقاق واحدة | Derivation |
| `⇒*` | صفر أو أكثر من خطوات | Closure of derivation |
| `M[X,a]` | جدول الإنتاج | LL(1) Parsing |
| `First(X)` | رموز بداية X | بناء جدول M |
| `Follow(X)` | رموز ما بعد X | ملء M عند X→ε |
| `$` | نهاية المدخل | Stack وInput |
| `ε` | سلسلة فارغة | قواعد الإنتاج |
| `Reduce` | اختزال قمة المكدس إلى Nonterminal | Bottom-Up |
| `Shift` | نقل رمز من المدخل للمكدس | Bottom-Up |

### 🔑 قواعد ذهبية لا تُنسى

| # | القاعدة |
| --- | --- |
| 1 | `Follow` لا يحوي `ε` أبداً |
| 2 | `$` دائماً في `Follow(Start Symbol)` |
| 3 | عند `X → ε` ← استخدم `Follow(X)` لملء جدول M |
| 4 | Predictive Parser = Top-Down + No Backtracking + جدول M |
| 5 | تعارض في جدول M = القواعد ليست LL(1) |
| 6 | Bottom-Up أقوى من Top-Down (يتعامل مع قواعد أكثر) |
| 7 | `Shift-Reduce` هو الاسم التشغيلي لـ Bottom-Up Parsing |
| 8 | α تُدفع على المكدس **معكوسة** ليكون أول رمز في القمة |

---

## الجزء السادس: قائمة فحص ذاتي قبل الامتحان ✅

- [ ] أستطيع تعريف `Parsing` وشرح هدفه في المترجم
- [ ] أعرف الفرق بين `Leftmost` و`Rightmost Derivation` وأستطيع تطبيقهما
- [ ] أستطيع تطبيق `Recursive Descent with Backtracking` يدوياً
- [ ] أعرف شروط `Predictive Parsing` وأستطيع التحقق منها
- [ ] أستطيع شرح مكونات `Non-Recursive Predictive Parser` الأربعة
- [ ] أستطيع حساب `First(X)` لأي Nonterminal
- [ ] أستطيع حساب `Follow(X)` لأي Nonterminal
- [ ] أعرف أن `Follow` لا يحتوي على `ε` أبداً
- [ ] أستطيع بناء جدول LL(1) كامل من القواعد
- [ ] أعرف كيف يستخدم المحلل جدول M خطوة بخطوة
- [ ] أستطيع تتبع `Predictive Parser` مع Stack وInput يدوياً
- [ ] أعرف الفرق بين `Top-Down` و`Bottom-Up` Parsing
- [ ] أستطيع شرح `Shift-Reduce Parsing` بمثال
- [ ] أستطيع إزالة `Left Recursion` من قواعد بسيطة
- [ ] أستطيع تطبيق `Left Factoring` على قواعد بها بادئات مشتركة
- [ ] أستطيع تشخيص إذا كانت القواعد LL(1) أم لا
- [ ] أعرف دور `$` في Stack وInput
- [ ] أستطيع ملء جدول First وFollow وبناء جدول M بالكامل

---

## بطاقات Q&A (≥16 بطاقة)

**Q1:** ما هو `Parsing`؟
**A:** التحقق من أن سلسلة رموز تنتمي للغة المعرّفة بـCFG وبناء شجرة الاشتقاق.

---

**Q2:** ما الفرق بين `Leftmost` و`Rightmost Derivation`؟
**A:** Leftmost يستبدل أقصى Nonterminal يساراً، Rightmost يستبدل أقصى Nonterminal يميناً.

---

**Q3:** ما شرط `Predictive Parsing`؟
**A:** لا Left Recursion + قواعد Left Factored + لا تعارض في First لبدائل نفس Nonterminal.

---

**Q4:** ما الفرق بين `First(X)` و`Follow(X)`؟
**A:** First = Terminals تبدأ اشتقاق X؛ Follow = Terminals تأتي بعد X في أي اشتقاق. Follow لا يحتوي ε.

---

**Q5:** متى نستخدم `Follow(X)` في بناء جدول M؟
**A:** فقط عندما X له قاعدة → ε (أي X يمكن أن يختفي).

---

**Q6:** ما مكونات `Non-Recursive Predictive Parser`؟
**A:** Table of Productions (M)، Stack، Input String، Processing Program.

---

**Q7:** ما معنى خلية `M[X,a]` فارغة؟
**A:** خطأ نحوي — السلسلة لا تنتمي للغة.

---

**Q8:** ما معنى `M[X,a] = X → ε`؟
**A:** اطرح X من المكدس بدون قراءة أي رمز من المدخل.

---

**Q9:** كيف تعرف أن الجدول LL(1) يحتوي تعارضاً؟
**A:** إذا وُجدت خلية تحتوي أكثر من قاعدة إنتاج واحدة.

---

**Q10:** ما هو `Bottom-Up Parsing`؟
**A:** يبدأ من Terminals ويختزل إلى Nonterminals حتى يصل إلى Start Symbol، يستخدم Shift وReduce.

---

**Q11:** لماذا `Bottom-Up` أقوى من `Top-Down`؟
**A:** يتعامل مع مجموعة أكبر من القواعد (LR أقوى من LL) ولا يتطلب Left Factoring.

---

**Q12:** ما هي `Left Recursion` ولماذا هي مشكلة؟
**A:** قاعدة A → Aα تجعل Top-Down يدور في حلقة لا نهائية. يجب إزالتها قبل بناء LL(1) Parser.

---

**Q13:** كيف تُزال `Left Recursion`؟
**A:** `A → Aα | β` يصبح `A → βA'`، `A' → αA' | ε`.

---

**Q14:** ما هو `Left Factoring`؟
**A:** استخراج البادئة المشتركة من بدائل نفس Nonterminal. `A → αβ | αγ` يصبح `A → αA'`، `A' → β | γ`.

---

**Q15:** ما هو `LL(1)`؟ ماذا تعني الأرقام؟
**A:** L = Left-to-right scan، L = Leftmost Derivation، 1 = رمز lookahead واحد.

---

**Q16:** هل `Follow` يحتوي على `ε`؟
**A:** لا أبداً. Follow يحتوي فقط Terminals و`$`.

---

**Q17:** ما الحالة الابتدائية لـStack وInput في Predictive Parser؟
**A:** Stack = `[Start Symbol, $]` (Start Symbol في القمة)؛ Input = `السلسلة $`.

---

**Q18:** ما هو `Backtracking` ولماذا نتجنبه؟
**A:** إعادة المحاولة بقاعدة أخرى عند الفشل. نتجنبه لأنه مكلف حسابياً؛ Predictive Parsing يحلّ هذه المشكلة.

---

**Q19:** متى تصبح خلية M[E1,)] = E1→ε منطقية؟
**A:** لأن `)` ∈ Follow(E1)، وعند وجود `)` في المدخل وE1 في قمة المكدس، نختزل E1 إلى ε (تختفي).

---

**Q20:** ما الفرق بين `Operator Precedence Parsing` و`Shift-Reduce Parsing`؟
**A:** Operator Precedence يعتمد على أولوية العمليات فقط (بسيط)؛ Shift-Reduce أعم وأشمل يعتمد على جداول Action/Goto.

---

<!-- VALIDATION
lecture: 6
topic: Parsing & Derivation, Top-Down Parsing, Bottom-Up Parsing, Predictive Parsing, First, Follow, LL(1)
slides_covered: 69-82
parts:
  - integration_map: ✓
  - detail: ✓ (sections 1-8, all slides covered)
  - summary: ✓ (tables: definitions, components, comparisons, glossary, golden_rules, errors)
  - algorithms: ✓ (non-recursive parser, recursive descent, LL(1) table construction, First, Follow)
  - mcq: 18 questions ✓ (medium/hard, with full justification for each option)
  - debug: 5 questions ✓ (wrong_derivation, left_recursion, wrong_formula, ambiguous_grammar, misconception)
  - exercise: 7 exercises ✓ (first_follow_calc, grammar_transform, table_fill, scenario)
  - analysis_exercise: 3 exercises ✓ (parse_table_construction, case_study, written_analysis)
  - trace_exercise: 5 exercises ✓ (derivation_steps, parse_stack_trace×2, follow_calc, backtracking)
  - theory: 11 questions ✓
  - qa_cards: 20 cards ✓
  - cheat_sheet: ✓
  - self_check: ✓
validation: PASS
-->
