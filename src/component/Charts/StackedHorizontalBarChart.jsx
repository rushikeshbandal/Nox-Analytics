import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const AGES = ["<10","10-19","20-29","30-39","40-49","50-59","60-69","70-79","≥80"];

const RAW_DATA = [
  {name:"AL","<10":598478,"10-19":638789,"20-29":661666,"30-39":603013,"40-49":625599,"50-59":673864,"60-69":548376,"70-79":316598,"≥80":174781},
  {name:"AK","<10":106741,"10-19":99926,"20-29":120674,"30-39":102008,"40-49":91539,"50-59":104569,"60-69":70473,"70-79":28422,"≥80":12503},
  {name:"AZ","<10":892083,"10-19":912735,"20-29":939804,"30-39":857054,"40-49":833290,"50-59":834858,"60-69":737884,"70-79":466153,"≥80":254716},
  {name:"AR","<10":392177,"10-19":397185,"20-29":399698,"30-39":372998,"40-49":370157,"50-59":395070,"60-69":329734,"70-79":197985,"≥80":113468},
  {name:"CA","<10":5038433,"10-19":5170341,"20-29":5809455,"30-39":5354112,"40-49":5179258,"50-59":5042094,"60-69":3737461,"70-79":2011678,"≥80":1311374},
  {name:"CO","<10":690830,"10-19":697447,"20-29":780508,"30-39":766382,"40-49":705450,"50-59":725661,"60-69":563376,"70-79":274466,"≥80":155175},
  {name:"CT","<10":399369,"10-19":481065,"20-29":462323,"30-39":424890,"40-49":496265,"50-59":546361,"60-69":400995,"70-79":217827,"≥80":159475},
  {name:"DE","<10":112177,"10-19":117854,"20-29":127554,"30-39":114063,"40-49":117588,"50-59":133331,"60-69":110822,"70-79":65369,"≥80":35937},
  {name:"DC","<10":74377,"10-19":62783,"20-29":136976,"30-39":121520,"40-49":80570,"50-59":74779,"60-69":56984,"70-79":31362,"≥80":19658},
  {name:"FL","<10":2211012,"10-19":2331102,"20-29":2597830,"30-39":2416176,"40-49":2575576,"50-59":2762983,"60-69":2404659,"70-79":1615547,"≥80":1019566},
  {name:"GA","<10":1363631,"10-19":1421557,"20-29":1418696,"30-39":1357210,"40-49":1404698,"50-59":1337985,"60-69":998253,"70-79":528108,"≥80":269182},
  {name:"HI","<10":176484,"10-19":163559,"20-29":204336,"30-39":187590,"40-49":176904,"50-59":188438,"60-69":164957,"70-79":85345,"≥80":66060},
  {name:"ID","<10":236658,"10-19":239509,"20-29":218684,"30-39":209500,"40-49":194678,"50-59":205170,"60-69":179429,"70-79":97621,"≥80":54234},
  {name:"IL","<10":1619682,"10-19":1715984,"20-29":1789739,"30-39":1721954,"40-49":1697069,"50-59":1773366,"60-69":1326121,"70-79":728821,"≥80":478948},
  {name:"IN","<10":863029,"10-19":905594,"20-29":905590,"30-39":827086,"40-49":844059,"50-59":911778,"60-69":704523,"70-79":384788,"≥80":243131},
  {name:"IA","<10":401712,"10-19":418667,"20-29":419456,"30-39":383638,"40-49":370719,"50-59":427554,"60-69":344037,"70-79":197223,"≥80":143583},
  {name:"KS","<10":401751,"10-19":402092,"20-29":406956,"30-39":368732,"40-49":344427,"50-59":389834,"60-69":300759,"70-79":166104,"≥80":117637},
  {name:"KY","<10":555615,"10-19":575866,"20-29":593819,"30-39":558201,"40-49":580553,"50-59":623164,"60-69":495736,"70-79":273961,"≥80":155074},
  {name:"LA","<10":622061,"10-19":613633,"20-29":683606,"30-39":615411,"40-49":571991,"50-59":631936,"60-69":488846,"70-79":266123,"≥80":152063},
  {name:"ME","<10":137954,"10-19":155774,"20-29":156359,"30-39":147695,"40-49":176908,"50-59":215787,"60-69":179540,"70-79":97899,"≥80":62007},
  {name:"MD","<10":741952,"10-19":764730,"20-29":815346,"30-39":784097,"40-49":815875,"50-59":862778,"60-69":636309,"70-79":330736,"≥80":208079},
  {name:"MA","<10":737748,"10-19":862371,"20-29":971340,"30-39":847306,"40-49":916106,"50-59":979128,"60-69":737805,"70-79":401931,"≥80":288408},
  {name:"MI","<10":1181424,"10-19":1324071,"20-29":1338179,"30-39":1162186,"40-49":1283122,"50-59":1454462,"60-69":1148131,"70-79":619722,"≥80":398303},
  {name:"MN","<10":711604,"10-19":714399,"20-29":728222,"30-39":715583,"40-49":692201,"50-59":782655,"60-69":577313,"70-79":312906,"≥80":215985},
  {name:"MS","<10":400288,"10-19":421329,"20-29":414195,"30-39":374724,"40-49":377165,"50-59":400164,"60-69":319443,"70-79":181195,"≥80":100689},
  {name:"MO","<10":763948,"10-19":792935,"20-29":831725,"30-39":763002,"40-49":750989,"50-59":857534,"60-69":668878,"70-79":388086,"≥80":242554},
  {name:"MT","<10":126020,"10-19":126294,"20-29":136346,"30-39":125004,"40-49":116502,"50-59":149800,"60-69":130977,"70-79":70528,"≥80":41920},
  {name:"NE","<10":263518,"10-19":257610,"20-29":260646,"30-39":244236,"40-49":222479,"50-59":250911,"60-69":195705,"70-79":107650,"≥80":78504},
  {name:"NV","<10":369362,"10-19":360263,"20-29":392834,"30-39":390261,"40-49":387272,"50-59":373757,"60-69":309651,"70-79":173499,"≥80":82273},
  {name:"NH","<10":138762,"10-19":167495,"20-29":167554,"30-39":151409,"40-49":182703,"50-59":217950,"60-69":164287,"70-79":84791,"≥80":52552},
  {name:"NJ","<10":1079136,"10-19":1153625,"20-29":1139927,"30-39":1143452,"40-49":1254602,"50-59":1307263,"60-69":946399,"70-79":523620,"≥80":367432},
  {name:"NM","<10":276468,"10-19":282662,"20-29":289801,"30-39":260579,"40-49":244346,"50-59":280363,"60-69":239044,"70-79":135013,"≥80":74393},
  {name:"NY","<10":2319945,"10-19":2445591,"20-29":2894266,"30-39":2605355,"40-49":2617327,"50-59":2755620,"60-69":2095207,"70-79":1160055,"≥80":804091},
  {name:"NC","<10":1250298,"10-19":1310398,"20-29":1350242,"30-39":1268976,"40-49":1357746,"50-59":1356117,"60-69":1095320,"70-79":609234,"≥80":342497},
  {name:"ND","<10":99477,"10-19":91069,"20-29":124509,"30-39":94713,"40-49":80327,"50-59":98688,"60-69":73825,"70-79":41348,"≥80":32206},
  {name:"OH","<10":1422838,"10-19":1530264,"20-29":1535538,"30-39":1398724,"40-49":1490959,"50-59":1677794,"60-69":1320776,"70-79":728158,"≥80":481890},
  {name:"OK","<10":534481,"10-19":522282,"20-29":552528,"30-39":501392,"40-49":469410,"50-59":512850,"60-69":404704,"70-79":239887,"≥80":138055},
  {name:"OR","<10":474456,"10-19":485345,"20-29":538596,"30-39":537767,"40-49":507826,"50-59":534421,"60-69":490894,"70-79":255809,"≥80":157153},
  {name:"PA","<10":1458931,"10-19":1608018,"20-29":1712448,"30-39":1520409,"40-49":1645291,"50-59":1881378,"60-69":1491536,"70-79":850897,"≥80":615069},
  {name:"RI","<10":111377,"10-19":136885,"20-29":153674,"30-39":126503,"40-49":137892,"50-59":156127,"60-69":117653,"70-79":63359,"≥80":51021},
  {name:"SC","<10":599591,"10-19":619144,"20-29":667523,"30-39":596491,"40-49":619792,"50-59":663408,"60-69":579856,"70-79":322073,"≥80":166727},
  {name:"SD","<10":120366,"10-19":113383,"20-29":116748,"30-39":105499,"40-49":96288,"50-59":117012,"60-69":92824,"70-79":50398,"≥80":38540},
  {name:"TN","<10":818404,"10-19":842873,"20-29":895337,"30-39":837313,"40-49":866343,"50-59":904272,"60-69":741045,"70-79":414939,"≥80":227483},
  {name:"TX","<10":3983091,"10-19":3910528,"20-29":3946447,"30-39":3770534,"40-49":3545746,"50-59":3344930,"60-69":2431494,"70-79":1291486,"≥80":732179},
  {name:"UT","<10":513515,"10-19":479126,"20-29":465219,"30-39":436010,"40-49":328569,"50-59":301596,"60-69":230007,"70-79":123674,"≥80":70711},
  {name:"VT","<10":63768,"10-19":79351,"20-29":81765,"30-39":70092,"40-49":79982,"50-59":99521,"60-69":82136,"70-79":42978,"≥80":26656},
  {name:"VA","<10":1033629,"10-19":1065461,"20-29":1170634,"30-39":1112111,"40-49":1134928,"50-59":1162028,"60-69":881763,"70-79":475141,"≥80":274606},
  {name:"WA","<10":895790,"10-19":882812,"20-29":1004428,"30-39":970613,"40-49":921205,"50-59":970407,"60-69":784208,"70-79":401094,"≥80":242589},
  {name:"WV","<10":207017,"10-19":218547,"20-29":232027,"30-39":220494,"40-49":238218,"50-59":269346,"60-69":243108,"70-79":138134,"≥80":79201},
  {name:"WI","<10":705648,"10-19":755224,"20-29":760961,"30-39":714479,"40-49":732280,"50-59":848672,"60-69":645015,"70-79":350772,"≥80":241747},
  {name:"WY","<10":78217,"10-19":75535,"20-29":82898,"30-39":76912,"40-49":68464,"50-59":81018,"60-69":67484,"70-79":32819,"≥80":19682},
  {name:"PR","<10":389428,"10-19":479749,"20-29":480184,"30-39":441842,"40-49":456009,"50-59":452503,"60-69":411924,"70-79":268783,"≥80":148963},
];

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

const getTotal = (row) => AGES.reduce((s, k) => s + (row[k] || 0), 0);
const SORTED   = [...RAW_DATA].sort((a, b) => getTotal(b) - getTotal(a));

// ─── Legend ────────────────────────────────────────────────────────────────────
function LegendHTML({ palette, topStates }) {
  const color = d3.scaleOrdinal().domain(AGES).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        AGE GROUPS
      </div>
      {AGES.map(k => (
        <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(k) }} />
          <span style={{ color:"#334155", fontSize:11 }}>{k}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        TOP STATES
      </div>
      {topStates.map(row => (
        <div key={row.name} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ color:"#334155", fontSize:11 }}>{row.name}</span>
          <span style={{ color:"#64748b", fontSize:10, fontWeight:"600" }}>{(row.total/1e6).toFixed(1)}M</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ──────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(AGES).range(palette);

  useEffect(() => {
    if (!svgRef.current) return;
    const W      = 680;
    const rowH   = 22;
    const margin = { top:32, right:68, bottom:36, left:48 };
    const H      = SORTED.length * rowH + margin.top + margin.bottom;

    const stackData = SORTED.map(row => {
      const obj = { state: row.name };
      AGES.forEach(age => { obj[age] = row[age] || 0; });
      return obj;
    });

    const stack       = d3.stack().keys(AGES).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
    const stackedData = stack(stackData);
    const maxVal      = d3.max(stackedData[stackedData.length - 1], d => d[1]);

    const x = d3.scaleLinear().domain([0, maxVal * 1.06]).range([margin.left, W - margin.right]).nice();
    const y = d3.scaleBand().domain(SORTED.map(d => d.name)).range([margin.top, H - margin.bottom]).padding(0.22);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat("").tickSize(-(H-margin.top-margin.bottom)).ticks(8))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    stackedData.forEach(layer => {
      svg.append("g").selectAll("rect").data(layer).enter().append("rect")
        .attr("y",      d => y(d.data.state))
        .attr("x",      d => x(d[0]))
        .attr("width",  d => Math.max(0, x(d[1])-x(d[0])))
        .attr("height", y.bandwidth())
        .attr("fill",   color(layer.key))
        .attr("rx",3).attr("opacity",0.88)
        .attr("stroke","#fff").attr("stroke-width",0.5)
        .style("cursor","pointer")
        .on("mouseover", function(event,d) {
          d3.select(this).attr("opacity",1);
          tooltip.style("opacity",1)
            .html(`<b style="color:${color(layer.key)}">${layer.key}</b><br/>State: ${d.data.state}<br/>Population: <b>${((d[1]-d[0])/1e6).toFixed(2)}M</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.88); tooltip.style("opacity",0); });

      svg.append("g").selectAll("text").data(layer).enter().append("text")
        .filter(d => (x(d[1])-x(d[0])) > 38)
        .attr("x",  d => (x(d[0])+x(d[1]))/2)
        .attr("y",  d => y(d.data.state)+y.bandwidth()/2)
        .attr("dy","0.35em").attr("text-anchor","middle")
        .attr("fill","#fff").style("font-size","8px").style("font-weight","700")
        .style("pointer-events","none")
        .text(d => ((d[1]-d[0])/1e6).toFixed(1)+"M");
    });

    svg.append("g").selectAll("text").data(SORTED).enter().append("text")
      .attr("x",  d => x(getTotal(d))+4)
      .attr("y",  d => y(d.name)+y.bandwidth()/2)
      .attr("dy","0.35em").attr("fill","#64748b")
      .style("font-size","9px").style("font-weight","700")
      .text(d => (getTotal(d)/1e6).toFixed(1)+"M");

    svg.append("g").attr("transform",`translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(8).tickFormat(d => (d/1e6).toFixed(0)+"M"))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#64748b").style("font-size","10px"); });

    svg.append("g").attr("transform",`translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#334155").style("font-size","10px").style("font-weight","600"); });

    svg.append("text")
      .attr("transform",`translate(${(W-margin.right+margin.left)/2},${H-6})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("Population by Age Group");

    return () => tooltip.remove();
  }, [theme]);

  const topStates = SORTED.slice(0,8).map(r => ({ name:r.name, total:getTotal(r) }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:540 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={palette} topStates={topStates} />
      </div>
    </div>
  );
}

// ─── 3D Chart — white screen fixed ────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(AGES).range(palette);
  const top10      = SORTED.slice(0, 10);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── FIX 1: Clear any existing canvas before appending new one ──────────
    // Prevents double-canvas in React StrictMode
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 480;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // ── FIX 2: Prevent canvas from causing page reflow on click ────────────
    renderer.domElement.style.display      = "block";
    renderer.domElement.style.outline      = "none";
    renderer.domElement.style.userSelect   = "none";
    renderer.domElement.style.webkitUserSelect = "none";

    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6, 14, 10); sun.castShadow = true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]), 0.4, 60);
    rimL.position.set(-10, 6, -6); scene.add(rimL);
    const frontL = new THREE.PointLight(0xffffff, 0.5, 80);
    frontL.position.set(0, 8, 18); scene.add(frontL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor + grid
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 30),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    scene.add(new THREE.GridHelper(44, 36, 0xcccccc, 0xe2e8f0));

    const maxVal   = d3.max(top10, d => getTotal(d));
    const maxH     = 8;
    const groupGap = 3.0;
    const barD     = 0.52;
    const barW     = 0.54;

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    top10.forEach((row, ri) => {
      const z     = (ri - (top10.length - 1) / 2) * groupGap;
      let xOffset = -(AGES.length * (barW + 0.06)) / 2;

      AGES.forEach((age, ai) => {
        const val = row[age] || 0;
        if (val === 0) { xOffset += barW + 0.06; return; }

        const bh  = (val / maxVal) * maxH;
        const col = new THREE.Color(color(age));
        const xp  = xOffset + barW / 2;

        // ── FIX 3: Proper shadow mesh — NO Object.assign ────────────────────
        const shadowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh * 0.1, barD),
          new THREE.MeshBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.10 })
        );
        shadowMesh.position.set(xp + 0.05, bh * 0.05, z + 0.05);
        pivot.add(shadowMesh);

        // Main bar
        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mat  = new THREE.MeshStandardMaterial({
          color: col, roughness: 0.22, metalness: 0.45,
          emissive: col, emissiveIntensity: 0.22,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xp, bh / 2, z);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eln = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
        );
        eln.position.set(xp, bh / 2, z);
        pivot.add(eln);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.28);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barD),
          new THREE.MeshStandardMaterial({
            color: capC, emissive: capC,
            emissiveIntensity: 1.3, roughness: 0.04, metalness: 1,
          })
        );
        cap.position.set(xp, bh + 0.035, z);
        pivot.add(cap);

        labelAnchors.push({ x:xp, y:bh+0.65, z, text:(val/1e6).toFixed(1)+"M", col:`#${col.getHexString()}`, type:"value"  });
        labelAnchors.push({ x:xp, y:bh+1.38, z, text:age,                      col:`#${col.getHexString()}`, type:"age"    });
        xOffset += barW + 0.06;
      });

      labelAnchors.push({ x:0, y:-0.65, z, text:row.name, col:"#334155", type:"region" });
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // Drag rotation + auto-spin
    let isDragging = false, prevX = 0, prevY = 0,
        rotX = 0.28, rotY = 0, autoSpin = true;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    // ── FIX 4: preventDefault stops browser text-select / page-scroll on drag
    const onDown = e => {
      e.preventDefault();
      isDragging = true; prevX = e.clientX; prevY = e.clientY;
      autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.004;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".shlbl").forEach((div, i) => {
          const a      = labelAnchors[i];
          if (!a) return;
          const rotVec = new THREE.Vector3(a.x, a.y, a.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rotVec.x, rotVec.y, rotVec.z);
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      // Remove canvas safely
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // JSX overlay labels (same count + order as labelAnchors)
  const jsxLabels = [];
  top10.forEach(row => {
    AGES.forEach((age, ai) => {
      const val = row[age] || 0;
      if (val === 0) return;
      const col = THEMES[theme][ai % THEMES[theme].length];
      jsxLabels.push({ text:(val/1e6).toFixed(1)+"M", col, type:"value" });
      jsxLabels.push({ text:age,                       col, type:"age"   });
    });
    jsxLabels.push({ text:row.name, col:"#334155", type:"region" });
  });

  const topStates = top10.map(r => ({ name:r.name, total:getTotal(r) }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        {/* Three.js canvas mount point */}
        <div
          ref={mountRef}
          style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }}
        />

        {/* HTML label overlay */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="region" ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background:    a.type==="region" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="age" ? 8 : a.type==="value" ? 9 : 10,
              fontWeight:    "bold",
              padding:       "2px 5px",
              borderRadius:  3,
              border:        a.type==="region" ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              transition:    "opacity 0.1s",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,   // ← FIX 5: start hidden, animation loop positions them
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Each cluster = one state (Top 10) · Colors = age groups
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={palette} topStates={topStates} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const StackedHorizontalBarChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Horizontal Stacked Population Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          US Population by State &amp; Age Group · 2020 Census
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ minHeight:480 }}>
        {viewMode === "2d"
          ? <Chart2D key={`2d-${theme}`} theme={theme} />
          : <Chart3D key={`3d-${theme}`} theme={theme} />
        }
      </div>
    </div>
  );
};

export default StackedHorizontalBarChart;