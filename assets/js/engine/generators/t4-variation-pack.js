/* Original Practice questions; independent verifier: scripts/engine-checks/t4-variation-pack.mjs. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, dp, sf, frac } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.register(Object.assign({ calculator: false }, def));
  const prob = (s) => `\\mathrm{P}(${s})`;
  const show = (x) => `$${num(x)}$`;
  const CDF = (n,p,k) => {
    let f = (1 - p) ** n, s = f;
    for (let j = 0; j < k; j++) { f *= (n - j) / (j + 1) * p / (1 - p); s += f; }
    return s;
  };
  const cdf4 = (x) => Math.round(x * 10000);
  const splitModel = (rng) => {
    const n = rng.pick([8, 10, 12, 14, 16, 18, 20]);
    const p = rng.pick([.2, .25, .3, .35, .4, .45, .5]);
    return { n, p, k: Math.max(3, Math.min(n-2, Math.round(n*p)+rng.int(0,2))) };
  };
  const forecast = { type: "t4-empirical-forecast", syllabus: ["4.5"], levels:[2], format:"value",
                     skills:["SL4.5.relative-frequency","SL4.5.expected-occurrences"] };
  reg({ ...forecast, representation:"table", unknown:"predict-combined-count", title:"Combine categories before making a forecast", source:"aa-sl-2023-may-tz1-p1-q03.b",
    build({rng}) {
      const counts=[rng.int(4,11),rng.int(4,11),rng.int(4,9),rng.int(4,9)], total=counts.reduce((a,b)=>a+b,0);
      const good=counts[0]+counts[1], multiple=rng.int(4,9), future=multiple*total, estimate=multiple*good;
      const table={head:["Request type","Number"],rows:["Renewal","Replacement","Account opening","Other"].map((name,i)=>[name,show(counts[i])])};
      return {params:{counts,future}, stem:`A library counts service requests during a sample week. It will move renewals and replacements to an online desk. Assume the same proportions next month, when ${show(future)} requests are expected.`, table, parts:[
        P("Estimate the probability that a request is handled by the online desk. Give an exact fraction.",2,ans.frac(good,total),[
          `Combine the renewal and replacement counts: $${counts[0]} + ${counts[1]} = ${good}$.`,
          `The table contains ${show(total)} requests, so the estimate is $${frac(good,total)}$.`
        ]),
        P("Estimate the number of requests handled by the online desk next month.",2,ans.int(estimate),[
          `Scale the sample by $${future} \\div ${total} = ${multiple}$.`,
          `The estimated count is $${multiple} \\times ${good} = ${estimate}$.`
        ])
      ]};
    }
  });
  reg({ ...forecast, representation:"words", unknown:"recover-sample-size", title:"Work backwards from a forecast", source:"aa-sl-2025-may-tz3-p2-q08.b",
    skills:[...forecast.skills,"SL4.5.complement"],
    build({rng}) {
      const total=rng.pick([16,20,24,25,30]), pass=rng.int(Math.ceil(total*.42),Math.floor(total*.72));
      const scale=rng.int(5,16), target=(total-pass)*scale;
      return {params:{total,pass,target},stem:`In a pilot run, ${show(pass)} of ${show(total)} badges printed clearly. Assume the same probability of printing clearly in a later run.`,parts:[
        P("Estimate the probability that a badge is not printed clearly. Give an exact fraction.",2,ans.frac(total-pass,total),[
          `The pilot includes $${total} - ${pass} = ${total-pass}$ badges that did not print clearly.`,
          `Divide by the total to get $${frac(total-pass,total)}$.`
        ]),
        P(`The later run is expected to have ${show(target)} unclear badges. How many badges are planned for that run?`,2,ans.int(total*scale),[
          `The unclear count scales by $${target} \\div ${total-pass} = ${scale}$.`,
          `Scale the whole pilot by the same factor: $${total} \\times ${scale} = ${total*scale}$.`
        ])
      ]};
    }
  });

  const readCdf = {type:"t4-binomial-reading-cdf", representation:"table", syllabus:["4.8"], format:"value", skills:["SL4.8.cumulative-probability"]};
  const tabCDF = (n,p,ks) => ({head:["$k$",`$${prob("X \\le k")}$`],rows:ks.map(k=>[show(k),`$${dp(CDF(n,p,k),4)}$`])});
  reg({ ...readCdf, unknown:"complement-boundary", levels:[1], title:"Read the correct complement from a cumulative table", source:"aa-sl-2026-may-tz1-p2-q09.b",
    build({rng}){
      const {n,p,k} = splitModel(rng), complement=cdf4(CDF(n,p,k-1)), result=(10000-complement)/10000;
      return {params:{n,p,k}, stem:`The table gives rounded cumulative probabilities for a binomial count $X$. Use the displayed values as given.`,table:tabCDF(n,p,[k-1,k,k+1]),parts:[
        P(`Find $${prob(`X \\ge ${k}`)}$.`,2,ans.dec(result),[
          `The opposite event is $X \\le ${k-1}$, not $X \\le ${k}$.`,
          `$${prob(`X \\ge ${k}`)} = 1 - ${dp(complement/10000,4)} = ${dp(result,4)}$.`
        ])
      ]};
    }
  });
  reg({ ...readCdf, unknown:"interval-and-point", levels:[3], title:"Recover interval and point probabilities from a cumulative table", source:"aa-sl-2025-may-tz3-p2-q08.c",
    skills:[...readCdf.skills,"SL4.8.exact-probability"],
    build({rng}){
      const {n,p,k}=splitModel(rng), lower=k-2, upper=k+1;
      const lo=cdf4(CDF(n,p,lower)), cur=cdf4(CDF(n,p,k)), prev=cdf4(CDF(n,p,k-1)), hi=cdf4(CDF(n,p,upper));
      const windowProb=(hi-lo)/10000, exactly=(cur-prev)/10000, other=1-hi/10000;
      return {params:{n,p,k,lower,upper},stem:`The table gives rounded cumulative probabilities for a binomial count $X$. Use the displayed values as given.`,table:tabCDF(n,p,[lower,k-1,k,upper]),parts:[
        P(`Find $${prob(`${lower} < X \\le ${upper}`)}$.`,2,ans.dec(windowProb),[
          `Subtract all counts at or below ${show(lower)} from the total through ${show(upper)}.`,
          `$${prob(`${lower} < X \\le ${upper}`)} = ${dp(hi/10000,4)} - ${dp(lo/10000,4)} = ${dp(windowProb,4)}$.`
        ]),
        P(`Find $${prob(`X = ${k}`)}$.`,2,ans.dec(exactly),[
          `$${prob(`X = ${k}`)} = ${prob(`X \\le ${k}`)} - ${prob(`X \\le ${k-1}`)}$.`,
          `$${prob(`X = ${k}`)} = ${dp(cur/10000,4)} - ${dp(prev/10000,4)} = ${dp(exactly,4)}$.`
        ]),
        P(`Find $${prob(`X > ${upper}`)}$.`,1,ans.dec(other),[
          `$${prob(`X > ${upper}`)} = 1 - ${dp(hi/10000,4)} = ${dp(other,4)}$.`
        ])
      ]};
    }
  });

  const cond = {type:"t4-binomial-with-condition",syllabus:["4.8","4.11"],levels:[4],calculator:true,format:"value",
                skills:["SL4.8.cumulative-probability","SL4.8.binomial-in-context","SL4.11.conditional-formula"]};
  reg({ ...cond, representation:"words", unknown:"restricted-count", title:"Update a probability after part of the count is reported", source:"aa-sl-2026-may-tz3-p2-q08.b",
    build({rng}){
      const {n,p,k}=splitModel(rng), lo=k-2, a=1-CDF(n,p,lo-1), b=CDF(n,p,k)-CDF(n,p,lo-1), c=b/a;
      return {params:{n,p,k,lo},stem:`A survey drone visits ${show(n)} sites. At each site it takes a usable image with probability ${show(p)}, independently of the other sites. Let $X$ be the number of usable images.`,parts:[
        P(`Find the probability of at least ${show(lo)} usable images.`,2,ans.sf(a),[
          `$X \\sim \\mathrm{B}(${n},\\, ${num(p)})$.`,
          `Use the complement: $${prob(`X \\ge ${lo}`)} = 1 - ${prob(`X \\le ${lo-1}`)} = ${sf(a)}$.`
        ]),
        P(`Find the probability that the number of usable images is between ${show(lo)} and ${show(k)}, inclusive.`,2,ans.sf(b),[
          `Subtract $${prob(`X \\le ${lo-1}`)}$ from $${prob(`X \\le ${k}`)}$.`,
          `The required probability is $${sf(b)}$.`
        ]),
        P(`It is reported that there were at least ${show(lo)} usable images. Find the probability there were no more than ${show(k)}.`,2,ans.sf(c),[
          `Given that $X \\ge ${lo}$, the relevant part of the original outcomes has probability $${sf(a,5)}$.`,
          `Divide the inclusive-range probability by that total: $${prob(`X \\le ${k} \\mid X \\ge ${lo}`)} = ${sf(c)}$.`
        ])
      ]};
    }
  });
  reg({ ...cond, representation:"table", unknown:"latent-source", title:"Infer a source from its binomial count", source:"aa-sl-2025-nov-tz1-p2-q06.a",
    skills:[...cond.skills,"SL4.11.reverse-conditional"],
    build({rng}){
      const n=rng.pick([8,10,12,14,16]), p0=rng.pick([.15,.2,.25,.3,.35]), p1=p0+.15, w=rng.pick([.3,.35,.4,.45,.55,.6,.65]), k=Math.max(3,Math.round(n*(p0+p1)/2));
      const a=1-CDF(n,p0,k-1),b=1-CDF(n,p1,k-1),mixed=w*a+(1-w)*b, posterior=w*a/mixed;
      const table={head:["Mode","Chance of mode","Return chance per signal"],rows:[["Canyon",show(w),show(p0)],["Ridge",show(1-w),show(p1)]]};
      return {params:{n,p0,p1,w,k},stem:`A beacon sends ${show(n)} signals using one of two modes. All signals use the same chosen mode; once the mode is fixed, the signal returns are independent. Some signals return to the beacon.`,table,parts:[
        P(`Given Canyon mode, find the probability of at least ${show(k)} returns.`,2,ans.sf(a),[
          `Use a binomial model with $n = ${n}$ and $p = ${num(p0)}$.`,
          `The cumulative probability from ${show(k)} to ${show(n)} is $${sf(a)}$.`
        ]),
        P(`Before the mode is known, find the probability of at least ${show(k)} returns.`,2,ans.sf(mixed),[
          `In Ridge mode, the same event has probability $${sf(b,5)}$.`,
          `Take the weighted sum of both mode-specific probabilities. The result is $${sf(mixed)}$.`
        ]),
        P(`At least ${show(k)} signals returned. Find the probability that Canyon mode was used.`,2,ans.sf(posterior),[
          `Find the joint probability by multiplying the conditional Canyon tail by the Canyon mode probability.`,
          `Divide that by the total probability of the report to get $${sf(posterior)}$.`
        ])
      ]};
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
