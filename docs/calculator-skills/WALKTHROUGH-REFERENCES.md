# Calculator walkthrough references

Teacher and maintainer notes for Calculator Skills. These references and practice limits are kept out of the student player. The curriculum, the actions shown in Watch, and the Try prompts and feedback remain the source of student-facing instructions. Add critical tips near the relevant action or in the Try hint, not in a general footer.

## [adjacency-walks](../../calculator-skills/adjacency-walks/)

**Scope**: Each entry is the number of directed arrows, not a distance. A walk may revisit a vertex or edge. To count any positive length through k, add corresponding entries of a, a², …, aᵏ; include the identity only when zero-edge walks are wanted. This trainer uses a 3×3 nonnegative integer matrix, counts 0–3, and exponents 2–6.

Sources: [TI matrix entry and storage (KB 31331)](https://education.ti.com/en/customer-support/knowledge-base/sofware-apps/computer-software-installation-activation/31331) · [TI matrix power reference](https://education.ti.com/html/webhelp/EG_TINspireCode/EN/Subsystems/RG_Nspire_EN/Content/M_RefGuide/RG_Symbols.htm) · [IB AI guide (AHL 3.15)](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=55)

## [angle-modes](../../calculator-skills/angle-modes/)

**Calculator notes**: On the handheld, use the touchpad pointer to click RAD or DEG on the Calculator page. In Try, click or tap the same spot. To choose Gradian or change defaults, use Home → 5: Settings → 2: Document Settings → Angle. Choose the unit requested in the question. Inverse trig takes a ratio and returns one principal angle. The superscript −1 means inverse, not reciprocal. If the question asks for all solutions, check its full interval.

Sources: [TI handbook: angle-mode indicator](https://education.ti.com/html/webhelp/eg_tinspire/en/content/m_hh_gs/gsc_the_hh_screen.HTML) · [TI handbook: Document Settings](https://education.ti.com/html/webhelp/eg_tinspire/en/content/m_confighh/hc_customizing_document_settings.HTML) · [TI guide: trig palette](https://education.ti.com/en/bulletinboard/2018/september/transitioning_to_the_ti-nspire)

## [area-between](../../calculator-skills/area-between/)

**What this practice viewer supports**: Two polynomial curves in x of degree up to four, with coefficients between −1000 and 1000 and increasing decimal bounds between −20 and 20. This rehearses the Graphs Bounded Area workflow one region at a time, not full TI firmware. Follow menu names; item numbers can vary by software version. If the upper curve changes, split at each crossing. A touch with no change of order does not require a split. Alternatively, on each region graph upper minus lower, then use Analyze Graph → Integral on the difference. Reverse the subtraction when the upper curve switches. The signed integral of one fixed difference can cancel parts of the area.

Sources: [TI guide: Analyze Graph → Bounded Area](https://education.ti.com/html/webhelp/nspire/4.0/SS/TI-NspireStudentSoftwareHelp_EN/Content/M_Graphs/GRA_Bounded_Area.htm)

## [binomial](../../calculator-skills/binomial/)

**Keep in your notes**: CDF adds the probabilities of all integer counts in a range, including both bounds. The possible counts are 0 through n. At least k: k to n. At most k: 0 to k. More than k: start at k + 1. Fewer than k: end at k − 1. Complement: subtract the probability of the counts outside your event from 1.

Sources: [TI’s button sequence](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29570) · [Exam reference: May 2022 AI SL P1 TZ2 Q5(c)](https://rktrobinhood.github.io/Math-AA---Question-Bank/questions/ai-sl-2022-may-tz2-p1-q05/)

## [binomial-pdf](../../calculator-skills/binomial-pdf/)

**PDF or CDF?**: Exactly 3: include 3 only. Use binomPdf(n,p,3). At most 3: include 0, 1, 2 and 3. Use binomCdf(n,p,0,3). The TI can return a full probability list if X Value is blank. This lesson always asks for one count. · Practise Binomial CDF

Sources: [TI’s button sequence](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29570)

## [binomial-test](../../calculator-skills/binomial-test/)

**Scope**: Assume a fixed number of independent binary trials with the same probability under H₀. The current IB AI HL guide assesses exact binomial tests one-sided only. For a strict critical region, this lesson rejects when the unrounded p-value is below α; equality is not below. A large p-value is not proof that H₀ is true. There is no continuity correction for an exact binomial calculation.

Sources: [TI Binomial Cdf (KB 29570)](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29570) · [IB AI guide (AHL 4.18)](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=68)

## [boxplots](../../calculator-skills/boxplots/)

**Calculator and lesson scope**: From a Data & Statistics page, bind a numeric list already entered in the same problem to the horizontal axis. You can also start from a named list. Use Menu → 1: Plot Type → 2: Box Plot. The default is modified. Plot Properties contains Extend Box Plot Whiskers and, after extending, Show Box Plot Outliers. For the lesson, sort the data and use the median of each half for Q₁ and Q₃; omit the middle observation when the count is odd. The mathematical 1.5 × IQR rule flags only values strictly outside the fences. Matching real handheld behavior for observations exactly on a fence has not been tested. Use 4–32 finite observations, with at most four decimal places.

Sources: [TI: create a box plot](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/36094) · [TI: compare the plot modes](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_datastats/ds_working_numeric_plot.HTML)

## [chi-square-goodness-of-fit](../../calculator-skills/chi-square-goodness-of-fit/)

**Expected counts, not percentages**: For a fixed distribution, multiply the total observed count by each claimed probability to get the expected counts. The lists must have the same total and order. With no parameters fitted from the data, df is the number of categories minus 1. In the current IB exam examples each expected count exceeds 5. Note down: χ² goodness-of-fit tests one variable against a claimed distribution. χ² independence tests an association between two categorical variables.

Sources: [TI χ² GOF on the handheld](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/35013) · [TI named-list wizard](https://education.ti.com/-/media/files/activities/us/math/statistics/chisquare-tests/chi-square-create.pdf)

## [chi-square-independence](../../calculator-skills/chi-square-independence/)

**What makes the test valid?**: Observed counts Each independent observation belongs to exactly one row and one column. Enter counts only, excluding row totals, column totals and percentages. The categories must be mutually exclusive within each variable. Expected counts Under independence, an expected count is its row total times its column total, divided by the grand total. In this IB-style lesson, every expected count must be greater than 5. Use a defensible study design; counts alone cannot establish independent observations. Never combine unlike categories just to obtain a test result. Meaning of PVal Assuming independence and the test conditions, it is the probability of a chi-square statistic at least as large as the one observed. A large p-value does not prove independence, and association does not establish causation.

Sources: [TI chi-square workflow](https://education.ti.com/en/ib/activities/applications-interpretation/nspire-chi-square-tests) · [IB Mathematics AI, SL 4.11](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)

## [complex](../../calculator-skills/complex/)

**Sign, quadrant, and angle rules**: In rectangular form a + bi, the modulus is √(a² + b²). The principal argument is measured anticlockwise from the positive real axis, typically −180° < θ ≤ 180° (or −π < θ ≤ π). The number −8 + 15i lies in quadrant II. Do not use just tan⁻¹(b/a) without checking the quadrant. The argument of zero is undefined. Degree polar display uses r∠θ. Radian polar display uses r·eiθ. Both describe the same complex number. For a polar input, enclose r∠θ in parentheses and check the displayed angle mode. Scoped TI-Nspire CX II-T reconstruction, not firmware.

Sources: [Texas Instruments CX II-T workbook (pp. 50–51)](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-sm-trb-for-cx-ii-t-03-april-2025.pdf#page=50)

## [confidence-intervals](../../calculator-skills/confidence-intervals/)

**Which interval applies?**: For an independent random sample from a normal population, choose z when the population SD σ is known. Choose t when estimating σ from the sample SD, even with a large sample. Interpret the interval for the population mean, not for individual observations. This rehearsal shows up to 12 significant digits, as in Float 12, so rounding is possible from the screen. Note down: interval = sample mean ± margin of error.

Sources: [TI z Interval](https://education.ti.com/-/media/37D0B43134CF4CBEAA4C74F7198A7A69) · [TI t Interval](https://education.ti.com/-/media/39FDDED8CB5742B3A201C04790C8B957)

## [counting](../../calculator-skills/counting/)

**Which calculation should I choose?**: Use n! to arrange all n distinct items. Use nCr(n,r) to choose r from n when roles or positions are not assigned. Enter n first. A count is an exact integer; it is not a probability by itself.

Sources: [Texas Instruments: combinations on the handheld](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29710)

## [counting-ai](../../calculator-skills/counting-ai/)

**Coefficient or probability?**: The coefficient counts where the successes can occur. It does not use the success probability p. This lesson accepts 0 ≤ r ≤ n ≤ 60; that is a practice limit, not a handheld limit.

Sources: [Texas Instruments: open Combinations](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29710)

## [coupled-euler](../../calculator-skills/coupled-euler/)

**Scope**: Calculator arithmetic only: this trainer is not a built-in ODE solver, phase-portrait emulator, or spreadsheet. It accepts editable linear systems for two forward Euler steps. TI documents a native euler() command; this walkthrough uses individual calculations to show how the two updates work. IB AHL 5.16 also includes nonlinear coupled updates. For the worked system, set y = x′ to reduce x″ + x′ + 2x = 0 (AHL 5.18). The exact continuous system has distinct nonzero eigenvalues (−1 ± i√7)/2 and approaches the origin in a spiral (AHL 5.17); two Euler steps alone do not establish this, and a larger step may distort the path.

Sources: [TI CX guide: Calculator application](https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/m_calculator.HTML) · [TI CX guide: euler()](https://education.ti.com/html/webhelp/EG_TINspire/EN_GB/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_alpha_E.HTML) · [IB AI guide, AHL 5.16–5.18](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=75)

## [derivative](../../calculator-skills/derivative/)

**Derivative vs tangent**: dy/dx gives a numerical slope at one point. If a question asks for an exact result, verify it by differentiation and keep it exact. Find the curve’s y-coordinate separately, then write y − y₀ = m(x − x₀). On the handheld, edit a point’s x-coordinate from its context menu if you need precise placement.

Sources: [TI’s handheld guide](https://education.ti.com/-/media/files/download-center/guidebooks/ti-nspire/5%2C-d-%2C4/gb_ti-nspire_cxii_handhelds/ti-nspire_cxii-hh_guidebook_en.aspx) · [TI’s exact-point note](https://education.ti.com/html/webhelp/nspire/3.2/NAVHH/TI-NspireNavigatorHelp_EN/Content/GraphsGeometry/GG_Working_with_Relations.htm#Finding_the_Derivative_at_a_Point_(the_Slope))

## [displacement-distance](../../calculator-skills/displacement-distance/)

**Calculator routes and practice limits**: In Graphs, x is time. Go to Menu → 6: Analyze Graph → 1: Zero to bracket a crossing. Confirm the lower and upper bounds, then mark the zero with Enter. Test the velocity on each side: a zero that only touches the axis is not a reversal. On the non-CAS/Exact Arithmetic CX II-T, Menu → 6: Analyze Graph → 6: Integral takes the lower and upper bounds. The result keeps its sign. For distance, repeat on each interval between reversals and add the magnitudes of these signed results. A true zero of velocity at a domain endpoint does not split the interval. This lesson simulator supports polynomials of degree 0 to 4 with coefficients from −1000 to 1000, decimal time bounds from 0 to 15, and the named Graphs tools. It is not TI firmware. Its Zero exercise isolates sign crossings; real calculator root-finding behavior near touch points can vary.

Sources: [TI Zero key path](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/21770) · [TI non-CAS graph tools](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_scratchpad/sc_graphing_with_the_scratchpad.HTML) · [TI CX II-T worked examples](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf)

## [eigenvalues](../../calculator-skills/eigenvalues/)

**Scope**: For A = [a b; c d], the characteristic equation is λ² − (a + d)λ + (ad − bc) = 0. To find a vector, use a nonzero row of (A − λI)v = 0. Use the second row if the first vanishes. Each eigenvector is nonzero and may be rescaled. Under repeated multiplication, a component on an eigenvector scales by λⁿ. A larger |λ| eventually dominates the relative direction only when that component is present initially and there is no tie in |λ|. Its sign controls flips, and |λ| controls growth or decay. This lesson uses Calculator arithmetic rather than the optional eigen commands; the reconstructed LCD shows decimals for irrational values. On the physical CX II-T with Exact Arithmetic enabled, Ctrl+Enter requests a decimal. Supported inputs: 2×2 whole entries from −20 to 20 and two distinct real roots.

Sources: [TI CX II-T features](https://education.ti.com/en-au/products/calculators/graphing-calculators/ti-nspire-cx-ii-cx-ii-cas) · [TI family eigen commands](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/34032) · [IB AI guide (AHL 1.15)](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=39)

## [euler-method](../../calculator-skills/euler-method/)

**Scope**: This is the Calculator-page arithmetic workflow, not a firmware emulator or a built-in ODE solver. Use y(next) = y + h·f(x,y) and x(next) = x + h, evaluating f with the old pair before updating either coordinate. Enter a fresh numerical expression for each step. The trainer accepts affine slopes ax + by + c, positive forward steps, and ordinary arithmetic with brackets; Graphs and spreadsheet approaches are separate.

Sources: [TI CX guide: Calculator application](https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/m_calculator.HTML) · [TI guidance: Euler’s local-linear steps](https://education.ti.com/en/activity/detail/eulers-method) · [IB AI guide (AHL 5.16)](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=75)

## [expectation](../../calculator-skills/expectation/)

**What does E(X) mean?**: Each possible outcome contributes its value multiplied by its probability. A discrete distribution has probabilities between 0 and 1 that add to 1. The expected value is the average approached over many repetitions under the same conditions. It need not be a possible single outcome. Use the full probability values. Recreated TI-Nspire CX II-T Calculator; this rehearsal supports ordinary arithmetic for weighted sums, not a dedicated expectation command. . Current IB Mathematics AA and AI SL 4.7.

Sources: [Texas Instruments: weighted expectation](https://education.ti.com/-/media/23A2CAF1D78B48A3BB93EB98ECA86B59#page=4)

## [exponential-regression](../../calculator-skills/exponential-regression/)

**What ExpReg actually fits**: TI fits a line to x and ln(y), so each y must be positive. The resulting model is y = a·bx. The number a is the model estimate at x = 0, not necessarily a measurement. The number b multiplies the estimate each time x increases by one; the percentage change is 100(b−1)%. Interpolation uses a new input inside the observed span. Extrapolation goes beyond it and assumes the trend continues. The reported r and r² describe the log-transformed line.

Sources: [TI reference for ExpReg](https://education.ti.com/html/webhelp/EG_TINspireLUA/EN/Subsystems/TI-Nspire%E2%84%A2%20RefeGuide/content/eg_refguide/m_refguide/rg_alpha_e.htm)

## [finance-solver](../../calculator-skills/finance-solver/)

**Why these settings?**: PV and FV From your perspective, the opening deposit leaves you now (negative PV); the balance is money you can receive later (positive FV). N, PpY and CpY N counts payment periods, not years. PpY is payment periods per year; CpY counts compoundings per year. Here we set them equal so N counts compounding periods, even though Pmt is zero. The nominal rate I(%) is entered per year as a percentage. Pmt and PmtAt Set Pmt to zero for no recurring payments. With no payments, the BEGIN/END timing does not change the result.

Sources: [TI handheld menu](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/22730) · [TI Finance Solver guide](https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/ca_financial_calculations.HTML)

## [graph minimum](../../calculator-skills/)

**Calculator steps**: Graphs → Menu → 6: Analyze Graph → 2: Minimum → lower bound → upper bound. Press Enter again if you want to pin a previewed point. Read the result as (x, y): where it occurs, then the minimum value.

Sources: [TI handheld guide](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/21770)

## [handset-keys](../../calculator-skills/handset-keys/)

**Handheld notes**: The example starts in Calculator in its normal Auto mode. Enter follows the current settings and what this model supports; it does not guarantee every result will be exact. For the same input, Ctrl + Enter asks for a decimal approximation without changing the settings.

Sources: [TI handheld shortcuts](https://education.ti.com/html/webhelp/eg_tinspire/en/content/m_ss_gs/ss_keyboardshortcuts.HTML) · [TI: evaluating expressions](https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/ca_enter_evaluate_math_expr.HTML)

## [handset-settings](../../calculator-skills/handset-settings/)

**Practice and device references**: Practice without the worked example Handset keys shows an exact fraction in Auto and Ctrl + Enter for a one-off decimal. Open a blank Scratchpad. Try sin(45) in both DEG and RAD using the angle indicator. Then compare Enter and Ctrl + Enter on 11÷7. Check what changes and what does not. On your own CX II-T, check Float 6, Angle and Calculation Mode in Document Settings. The browser Scratchpad does not reproduce that full menu. If a plot disagrees with your Calculator page, check the separate in Graphs settings. A manually selected unit can override the document setting. IB and TI references

Sources: [Graphing Angle](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_confighh/hc_customizing_gg_settings.HTML) · [IB AA angle conventions](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-guide-en.pdf#page=50) · [IB AI AHL 2.9 and Topic 3 angle conventions](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf) · [IB exam calculator policy](https://ibo.org/programmes/diploma-programme/assessment-and-exams/exam-calculator-policy/) · [Document settings](https://education.ti.com/html/webhelp/eg_tinspire/en/content/m_confighh/hc_customizing_document_settings.HTML) · [CX II model comparison](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_hh_gs/gsc_mathmodes.HTML) · [Results and templates](https://education.ti.com/html/webhelp/eg_tinspire/en/content/m_calculator/ca_enter_evaluate_math_expr.HTML) · [TI-84 Plus CE MathPrint](https://education.ti.com/html/eguides/graphing/84PlusCE/EN/content/eg_gsguide/m_setting_modes/sm_changing_mode_settings.HTML)

## [histogram](../../calculator-skills/histogram/)

**Scope**: This is a scoped reconstruction starting from a prepared one-variable list. Frequencies only, not density, unequal widths or a cumulative-frequency graph. The last step adds counts below a class boundary by hand. Entering a named list

Sources: [TI Histogram workflow](https://education.ti.com/-/media/files/activities/us/math/statistics/best-class_ns/nspire-bestclass-teacher-pdf.pdf) · [TI Bin settings and trace](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_datastats/ds_working_numeric_plot.HTML)

## [inequalities](../../calculator-skills/inequalities/)

**Calculator and lesson scope**: In Graphs, plot both functions. Use Menu → 6: Analyze Graph → 4: Intersection and bracket one intersection at a time. The calculator locates intersection points; interpreting signs and writing the number-line solution is your work. One polynomial or single fraction on the left, one polynomial on the right, and a closed decimal domain inside [−20,20]. Polynomials up to degree four; denominator up to degree two. For a fraction, bracket both polynomials. The teaching strip and test-value helper are not TI menu commands. This is a lesson simulator, not firmware.

Sources: [TI guide: find an intersection](https://education.ti.com/-/media/files/ti-education/us/professional-development/teks/tutorial-guides/ti-nspire-solving-a-system-of-equations.pdf)

## [integral](../../calculator-skills/integral/)

**What this practice viewer supports**: Continuous polynomials in x of degree up to four, with coefficients between −1000 and 1000 and increasing decimal bounds between −20 and 20. This models the Graphs integral tool, not TI firmware or the separate Calculator template. The colors distinguish sign for learning; the handheld does not color-code contributions automatically.

Sources: [TI eGuide: Analyze Graph → Integral](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_scratchpad/sc_graphing_with_the_scratchpad.HTML)

## [intersection](../../calculator-skills/intersection/)

**What to look for**: Where: Graphs → Menu → 6: Analyze Graph → 4: Intersection. Why: Put one bound on each side of the crossing you want. Repeat with a separate bracket for any other crossing. What you see: The x-coordinate solves f₁(x) = f₂(x). The y-coordinate is their common output. · For two linear equations: use LinSolve

Sources: [TI’s handheld tutorial](https://education.ti.com/-/media/files/ti-education/us/professional-development/teks/tutorial-guides/ti-nspire-solving-a-system-of-equations.pdf?la=en)

## [inverse-normal](../../calculator-skills/inverse-normal/)

**Keep in your notes**: Inverse Normal returns a value, in the units of the data. Enter invNorm(left area, mean, SD). Confirm the dialog, then press Enter again to calculate. Below the cutoff: enter that probability directly. Above the cutoff: enter 1 minus the stated right-tail probability. A left area greater than 0.5 gives a cutoff above the mean.

Sources: [Texas Instruments CX II-T worked reference, pp. 69–70](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf)

## [lengths-bearings](../../calculator-skills/lengths-bearings/)

**Quadrants, extending the method and sources**: Take α = tan⁻¹(|east| ÷ |north|) in degrees. From north clockwise, the bearing is α in NE, 180° − α in SE, 180° + α in SW, and 360° − α in NW. Use 000, 090, 180 or 270 on an axis. There is no bearing for a purely vertical line. If a rounded bearing reaches 360°, write 000°. For two 2D legs from a shared origin, reduce the difference of bearings to the included angle between 0° and 180°. If their lengths are p and q with included angle C, the endpoint separation is √(p² + q² − 2pq cos C). That is a different setup from the perpendicular displacement components in this example. This browser rehearsal models the Calculator keypad path, not the complete TI operating system. The compass sketch is a teaching diagram, not a calculator screen. · ·

Sources: [TI: angle settings](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_confighh/hc_customizing_document_settings.HTML) · [TI: handheld keypad shortcuts](https://education.ti.com/-/media/8E397FE4BC834CB988CD75EB8B2F7402) · [IB: AI guide, SL 3.1–3.3](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)

## [linear-regression](../../calculator-skills/linear-regression/)

**What the numbers mean**: m is the change in predicted y per extra unit of x. b is the prediction at x = 0, which may lie outside the observed inputs. Pearson r shows direction with its sign. The square r² does not show direction. · . The chart and bulk editor are learning aids, not handheld screens.

Sources: [TI's handheld key sequence](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/25110) · [TI's Lists & Spreadsheet guide](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_listssheet/ls_statistical_calculations.HTML)

## [linear-system](../../calculator-skills/linear-system/)

**Read and check the pair**: Use Calculator Menu → 3: Algebra → 2: Solve System of Linear Equations on the non-CAS menu. In {x,y} order, the first entry is x and the second is y. Check that the pair satisfies both equations. A parallel pair with different constants has no shared solution; identical lines have infinitely many. The reconstructed LCD uses a short message for a dependent system; the TI may instead give a free parameter. Some Press-to-Test settings disable the solver.

Sources: [TI non-CAS menu walkthrough](https://education.ti.com/-/media/ti/files/resources/student-parent/ti-nspire-best-practices.pdf#page=16) · [TI linSolve reference](https://education.ti.com/html/webhelp/EG_TINspire/EN/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_alpha_L.HTML)

## [log-linearization](../../calculator-skills/log-linearization/)

**Why this is semi-log, not log-log**: For y = A · Bx, take natural logs of positive y only: ln(y) = (ln B)x + ln A. A straight-line fit of x and ln(y) therefore gives A = eintercept and B = eslope. The saved f1 predicts ln(y), not y. Exponentiate its output to predict on the original scale. For a power model y = A xk, take logs of both positive variables and regress ln(y) on ln(x). That is a different workflow, not simulated here. A strong line in transformed data is evidence for a model, not proof it remains valid outside the data range. Current scope: .

Sources: [IB Mathematics AI, AHL 2.10](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf) · [TI Linear Regression guide](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/25110)

## [markov-chains](../../calculator-skills/markov-chains/)

**Method and sources**: Rows are destinations, columns are starting states. Use Tⁿs₀ for a finite-step prediction. For the strictly positive two-state matrices in this lesson, the states tend to a unique steady distribution. Its entries sum to 1 and multiplying by T leaves it unchanged. Not every transition matrix converges. This simulator covers only the keys and matrix operations used in the lesson.

Sources: [TI CX II-T matrix entry and multiplication](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/ti-nspire_cx-ii-t-quick-guide.pdf) · [IB AI 4.19](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=68)

## [matrices](../../calculator-skills/matrices/)

**What if the matrix has no inverse?**: A determinant is defined for a square matrix. A square matrix is invertible only when its determinant is nonzero. To check an inverse, multiply the original and its inverse in either order; you should get the identity matrix.

Sources: [TI matrix entry and inverse](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29690) · [TI CX II-T quick guide (pp. 10–12)](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/ti-nspire_cx-ii-t-quick-guide.pdf)

## [matrix-systems](../../calculator-skills/matrix-systems/)

**Method and sources**: Write the system as A·X = b, then put A⁻¹ on the left of b. There is no inverse when A is singular. For this extra diagnostic, rref reduces the three-column array [A | b]; a row 0, 0 | 1 is a contradiction. An all-zero row imposes no condition. This simulator covers only the keys and matrix operations used in the lesson.

Sources: [TI CX II-T Specialist Mathematics, pp. 38–39](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce_sm_trb_cxii-t_ebook.pdf) · [TI rref key path](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/28493)

## [matrix-transformations](../../calculator-skills/matrix-transformations/)

**Why this order?**: A point written as a 2×1 column goes on the right of the 2×2 transformation matrix. A row of the matrix acts on the column to produce one coordinate. Reversing these two operands cannot work: their two inner dimensions would be 1 and 2. Note down: matrix × point column → image column; read top to bottom.

Sources: [TI CX II-T quick guide: transformations](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/ti-nspire_cx-ii-t-quick-guide.pdf#page=9) · [TI matrix entry](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29690)

## [maximum](../../calculator-skills/maximum/)

**Why check the endpoints?**: Maximum in the Analyze Graph menu finds a local peak between the two search bounds. The absolute maximum on a closed interval can occur at an interior peak or at an endpoint. The search bounds locate the peak; the allowed interval comes from the problem.

Sources: [Texas Instruments: Analyze Graph keys and search bounds](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_scratchpad/sc_graphing_with_the_scratchpad.HTML)

## [minimum-route-table](../../calculator-skills/minimum-route-table/)

**Scope**: All roads are undirected and strictly positive. An optimal route never benefits from a repeated vertex here, so the four eligible simple routes are exhaustive. Fill row A, column D (and D,A in a symmetric table). This is neither a spanning tree nor a tour visiting every place. The Calculator only adds the road lengths; this lesson does not require Dijkstra’s algorithm or simulate a route button.

Sources: [TI Calculator arithmetic](https://education.ti.com/html/webhelp/nspire/3.9/SS/TI-NspireStudentSoftwareHelp_EN/Content/M_Calculator/CA_Entering_and_Evaluating_Math_Expressions.htm) · [IB AI guide (AHL 3.16)](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=56)

## [named-lists](../../calculator-skills/named-lists/)

**Raw list or frequency table?**: Raw data: each reading gets its own row. Frequency table: each value appears once, with its count beside it. A zero count is not an empty cell. Named columns become list variables in the current problem. The formula row is not the first data row. Use Tab to switch between the naming and data zones. Select an LCD cell to edit it; Enter stores your entry and moves down in the data rows.

Sources: [Texas Instruments: naming spreadsheet columns](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_listssheet/ls_creating_and_sharing_spreadsheet_data.HTML)

## [normal](../../calculator-skills/normal/)

**Keep in your notes**: Normal Cdf gives an area, not the height of the curve. Enter normCdf(lower, upper, mean, SD). Enter the standard deviation, not the variance. Below a bound: use −∞ for the lower endpoint. Above a bound: use +∞ for the upper endpoint, or subtract the probability below the bound from 1. The normal curve is continuous: a single endpoint has probability zero, so including it does not change the result.

Sources: [Texas Instruments: Probability menu route](https://education.ti.com/-/media/files/activities/us/math/statistics/is-it-normal/nspire-isitnormal-teacher-pdf.pdf) · [TI alternative via Statistics menu](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/36294)

## [normal-parameter](../../calculator-skills/normal-parameter/)

**Keep in your notes**: Find the standard score first with invNorm(left area, 0, 1). Then use x = μ + σz. Mean: μ = x − σz. Standard deviation: σ = (x − μ)/z. The spread must be positive. At the median, if the cutoff equals the mean then any positive spread works; if they differ, the values are inconsistent. Use the stored Ans, not a rounded copy of the display.

Sources: [Texas Instruments CX II-T workbook, pp. 70–71](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf)

## [number-entry](../../calculator-skills/number-entry/)

**What EE means**: EE means “times ten to the power of”. For example, 3E−2 is 3 × 10⁻². Read the calculator value first. Keep an exact answer if you have it. Otherwise round only the written final answer, as the question asks. On paper, write scientific notation as a × 10ⁿ.

Sources: [TI's reference for E notation](https://education.ti.com/html/webhelp/eg_tinspire/en/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_Symbols.HTML)

## [piecewise](../../calculator-skills/piecewise/)

**What the endpoint means**: In a Graphs entry line, open Math Templates, select the n-piece template, then set the piece count. Enter each expression next to its condition. The union of the two conditions gives the domain. Do not include the same x in both branches. The study circles and point checker are lesson overlays, not claims about native TI rendering. The simulator supports two polynomial expressions (up to cubic), decimal endpoints in [−20, 20] and single-sided conditions. This is a lesson, not full calculator firmware.

Sources: [TI CX II‑T workbook · printed page 12](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf#page=12) · [TI n-piece template keys](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/21431)

## [poisson](../../calculator-skills/poisson/)

**Calculator and lesson scope**: This lesson types poissPdf and poissCdf on the Calculator page. A typed command evaluates with one Enter; TI also documents a distribution dialog. Menu shortcuts vary by calculator and software version. Use the mean for the interval you are actually counting. A Poisson model assumes independent events and a constant average rate. This is AI HL AHL 4.17 through the November 2028 exams, not a hypothesis test. Poisson is not in the AI HL syllabus first assessed in 2029. This simulator accepts λ from 0.0001 to 120 and integer counts 0–150. It supports the Poisson commands, including right tails written as 1−poissCdf(λ,0,k), rather than arbitrary calculator expressions.

Sources: [Texas Instruments: Poisson commands and dialog](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29450) · [IB AI guide, AHL 4.17](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=67) · [IB: 2029 syllabus changes](https://www.ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-applications-and-interpretation-updates/)

## [quadratic-regression](../../calculator-skills/quadratic-regression/)

**Fitted versus observed**: In y = ax² + bx + c, the sign of a determines the direction of bending. For a < 0, test the vertex x = −b/(2a) if it lies in the interval. Always check the endpoints of the observed x-range. The largest recorded y is a data value, not a vertex. On the TI, add a Graphs page in the same problem and recall the stored f1. The chart and bulk editor here are study aids, not handheld screens.

Sources: [TI's handheld procedure](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/33931)

## [random-simulation](../../calculator-skills/random-simulation/)

**Model and sources**: Each spin is independent and every equal sector has the same chance. A longer simulation tends to be more stable, but any particular run can be farther from the exact value. The fixed Watch runs explain the method. Try generates new samples in the browser, not TI's pseudorandom sequence. This trainer covers the calculator workflow used here, not the entire operating system.

Sources: [TI randInt keys](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/32271) · [TI CX II-T menu](https://education.ti.com/-/media/AB3CA6FAD6E048FBAED3B403FA43AB47) · [TI CX command reference](https://education.ti.com/html/webhelp/EG_TINspire/EN/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_alpha_R.HTML) · [IB AI guide, SL 4.5](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=59)

## [sampling-means](../../calculator-skills/sampling-means/)

**Scope**: Normal population → exact normal sample mean (for independent observations). For a non-normal population with finite variance, the CLT is an approximation and convergence depends on shape; the current IB guide takes n > 30 as sufficient in exams. Enter standard deviation σ/√n into Normal Cdf, not variance σ²/n. For a one-sided event, leave its unused bound at the calculator’s infinity default.

Sources: [TI CX II-T workbook (p. 69)](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf) · [IB AI guide (AHL 4.15)](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)

## [sequences](../../calculator-skills/sequences/)

**Calculator routes and practice limits**: Consecutive sum: Calculator → Menu → 4: Calculus → 3: Sum. Enter the index letter first; Tab goes to the lower bound, upper bound and rule. The TI reference also documents typing sumSeq(rule,n,lower,upper). Stepped sum: Menu → 6: Statistics → 3: List Math → 5: Sum of Elements, then add seq inside it from 6: Statistics → 4: List Operations → 5: Sequence. The last argument is the step. seq alone returns the list, stopping at the last index at or below the upper bound. The practice calculator accepts n, decimal constants and + − × ÷ ^ (use * when typing multiplication). Use integer indices between −1,000 and 1,000, increasing ranges up to 80 terms, and positive integer steps. This is a lesson simulator, not TI firmware. Looking for the first term above a target? Check the actual sequence values at integer indices. If you use a continuous crossing to estimate where to look, test the neighboring integer indices in the original rule. Use a stepped list to check candidates when needed. CT16 shows a continuous crossing.

Sources: [TI worked key paths](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/28870) · [TI CX reference](https://education.ti.com/html/webhelp/EG_TINspire/EN/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_Symbols.HTML)

## [solve](../../calculator-skills/solve/)

**Calculator steps**: Calculator → Menu → 3: Algebra → 1: Numerical Solve. Use nSolve(equation, variable, lower, upper). Press → to leave an exponent before you type the equals sign. Use separate intervals to look for separate solutions.

Sources: [TI non-CAS reference guide](https://education.ti.com/html/webhelp/EG_TINspire/EN/Subsystems/EG_RefGuide/Content/M_RefGuide/RG_alpha_N.HTML)

## [spearman](../../calculator-skills/spearman/)

**Why use ranks?**: Spearman correlation measures monotonic association, not just linear association. It is Pearson r calculated on the paired ranks. Use ascending ranks for both columns and average any ties. A constant rank list gives undefined correlation. The handheld does not calculate the ranks for you in this workflow. The thin rehearsal opens a worksheet with blank named rank lists. . Current IB Mathematics AI SL 4.10 (SL and HL); not in the current Maths AA course.

Sources: [TI Pearson/Spearman teacher notes](https://education.ti.com/-/media/338124D863CA40E48A612C87A5C813C5)

## [stationary](../../calculator-skills/stationary/)

**What a derivative zero tells you**: The zero of f₂ gives an x-coordinate. Substitute into f₁ for y. A + to − change gives a local maximum; − to + gives a local minimum. For the cubics in this lesson, the same nonzero sign on both sides of an isolated derivative zero gives a stationary inflection. A crossing search may miss a touching zero. Use a known candidate and verify it, rather than treating a near-zero number as proof. The bound fields and candidate panel are lesson helpers, not TI menus. The simulator accepts smooth polynomials up to degree three and models the non-CAS menus.

Sources: [TI CX II‑T workbook · p. 41](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf) · [TI Graphs and Zero](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_scratchpad/sc_graphing_with_the_scratchpad.HTML)

## [t-tests](../../calculator-skills/t-tests/)

**One sample or two?**: A one-sample t-test uses the sample standard deviation, not a known population standard deviation. Paired observations give one sample of differences. Use the two-sample test for independent groups. For IB exam questions using equal population variances, select Pooled: Yes. Note down: Choose the direction before seeing p. A large p-value does not establish equal means.

Sources: [TI t-test lesson](https://education.ti.com/en/ib/activities/applications-interpretation/nspire-the-t-test) · [TI reference guide](https://education.ti.com/html/webhelp/EG_TINspireLUA/EN/Subsystems/TI-Nspire%E2%84%A2%20RefeGuide/content/eg_refguide/m_refguide/rg_alpha_t.htm)

## [threshold](../../calculator-skills/threshold/)

**What this practice viewer supports**: The practice viewer supports positive exponential models in the form A*B^x and positive horizontal targets reached strictly inside the time interval. Bases must be between 0.1 and 4, excluding 1; the end of the interval must be a whole day between 2 and 30. A growing model uses “at least”; a decreasing model uses “at most”. Other kinds of thresholds exist; this is a rehearsal of the menu, not calculator firmware.

Sources: [TI’s handheld tutorial: Analyze Graph → Intersection](https://education.ti.com/-/media/files/ti-education/us/professional-development/teks/tutorial-guides/ti-nspire-solving-a-system-of-equations.pdf)

## [trace-table](../../calculator-skills/trace-table/)

**Trace or table?**: In Graph Trace, the arrows move along the graph; typing an x-value and pressing Enter moves to that input. Read the second coordinate for the function value. Esc leaves Trace. Use Menu → 7: Table → 1: Split-screen Table (or Ctrl + T on the handheld) for rows of inputs. Click the table pane or use Ctrl + Tab to focus it. From that pane use Menu → 2: Table → 5: Edit Table Settings and set Independent to Ask for values between Auto rows. Keep Dependent at Auto to see the function values. The recreated LCD rounds display values like a numerical device; these are not CAS exact forms.

Sources: [TI Graph Trace instructions](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/33631) · [TI Split-screen Table instructions](https://education.ti.com/-/media/ti/files/resources/student-parent/ti-nspire-best-practices.pdf#page=19)

## [trapezoidal](../../calculator-skills/trapezoidal/)

**Calculator routes and practice limits**: On a Calculator page, choose Menu → 1: Actions → 1: Define. Enter f(x)= followed by the rule, then press Enter. Type the weighted expression manually, using f(number) for each ordinate. There is no Trapezoid key in this walkthrough. Use equal strips. With spacing h, multiply the sum of the endpoint heights and twice the interior heights by h/2. The weighted calculation estimates the signed integral; it does not reverse the sign of heights below the axis. Try accepts polynomials in x up to degree eight, bounds from −40 to 40, and 1–12 strips. Type * for multiplication. This is a lesson simulator, not firmware.

Sources: [TI CX II-T workbook, printed p. 59](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf#page=59) · [TI Define command](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/25130)

## [trig-interval](../../calculator-skills/trig-interval/)

**What this practice viewer supports**: It starts with a suitable prepared Graphs window and supports sine or cosine of x against a horizontal target from −1 to 1, across up to three cycles in degrees or radians. Use the term-by-term interval check for other periodic functions too. This is a menu rehearsal, not TI firmware.

Sources: [TI: Graphs & Geometry Settings](https://education.ti.com/html/eguides/nspire/eg_nspire/en/content/m_confighh/hc_customizing_gg_settings.HTML) · [TI: Analyze Graph tools](https://education.ti.com/html/webhelp/EG_TINspire/EN/content/m_scratchpad/sc_graphing_with_the_scratchpad.HTML)

## [vectors](../../calculator-skills/vectors/)

**Formula, units, and sources**: The dot product is a single number: multiply corresponding components and add. For nonzero vectors, cos θ = (a · b) ÷ (|a| |b|). Apply inverse cosine to get the angle from 0° to 180°, or 0 to π radians. A zero vector still has dot product 0, but no direction, so the angle is undefined. Use the angle unit requested by the question. The rehearsal opens a Calculator page in the task’s unit. On the physical TI, set it in Document Settings. Angle mode lesson. Recreated Calculator screen and controls, not TI firmware. Only two- or three-component real row vectors and the commands shown are implemented.

Sources: [Texas Instruments CX II-T workbook (pp. 89–90)](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-sm-trb-for-cx-ii-t-03-april-2025.pdf#page=89)

## [volume-revolution](../../calculator-skills/volume-revolution/)

**Why a difference of squares?**: For a washer, subtract the area of the hole from the area of the outside disk. Squaring the gap between the radii would give a different shape. A disk has inner radius zero. Around the y-axis the corresponding radii are horizontal distances, expressed in y. Note down: V = π∫(R² − r²) dx for this x-axis setup.

Sources: [TI numerical integral key path](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/25050) · [TI CX II-T Specialist Mathematics](https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-sm-trb-digital-2026.pdf)

## [voronoi](../../calculator-skills/voronoi/)

**Why squared distance?**: Taking a square root does not change the order of non-negative values. Smallest squared distance means nearest site. A tie between two sites marks their shared boundary only if neither is farther than a third site. When tied sites disagree, give no unique estimate unless the question gives a tie-break rule. Tied sites with the same reading still give the same estimate. The handset here evaluates arithmetic only. The optional map is a lesson illustration, not a TI screen.

Sources: [TI Calculator expressions](https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/ca_enter_evaluate_math_expr.HTML) · [IB AI SL 3.6](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=50)

## [window](../../calculator-skills/window/)

**Window or domain?**: The window only changes the rectangle you can see. It does not change which x-values the function allows.

Sources: [TI’s Window/Zoom reference](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/27950)

## [z-test](../../calculator-skills/z-test/)

**Scope**: This is the one-sample mean test using known population σ and an independent sample from a normal population. The wizard uses the raw list. It is not a one-proportion z test or a substitute for the t test when only sample s is available. Significance level α is used to interpret output, not typed into the TI z Test wizard.

Sources: [TI handheld KB 29150](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29150) · [IB AI guide (AHL 4.18)](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)

## [zeros](../../calculator-skills/zeros/)

**Zero or y-intercept?**: A zero is an x-coordinate where the function output is zero. For the y-intercept, use Menu → 5: Trace → 1: Graph Trace. Type 0 for x and press Enter. Read (0, 6): 6 is the y-intercept. The demo uses a window where both intercept types are visible.

Sources: [TI: evaluate a graph at a specific x](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/33631)
