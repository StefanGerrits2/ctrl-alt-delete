d3.tsv('./rawData4.txt')
    .then(data => {
        //return the data
        return data;
    })
    .then(data => transformData(data))
    .then(transformData => organiseData(transformData))
    .then(organiseData => renderStackedBars(organiseData));

//function for data transformation
function transformData(data){
    
    console.log('original data: ', data);
    
    //make new array with modified objects
    const cleanedObjects = data.map(object => {
        //only return neccessary pairs 
        return{
            //rename keys for easier usage
            herkomst: object.Herkomst_def,
            vertrouwen: +object.rapportcijfer,
            contact: object.Contact_gehad,
            stadsDeel: object.Stadsdeel,
            totStand: object.Totstand,
            gevolgen: [
                object.polben_gevolg_anders,
                object.polben_gevolg_bekeuring,
                object.polben_gevolg_niets,
                object.Polben_arrestatie,
                object.polben_gevolg_waarschuwing
            ],
            beleefd: object.stel_beleefd,
            luister: object.stel_luisteren,
            rechtvaardig: object.stel_rechtvaardig
        };
    });

    //console.log('hiee',cleanedObjects)
    //return the cleaned objects
    return cleanedObjects;   
}

function organiseData(data){

    console.log('trans: ', data);

    const originTotal = [];

    const answerYes = data.filter( object => {

        if(object.contact == 'Ja' && object.totStand != 'De respondent heeft deze vraag niet beantwoord' && object.herkomst != 'Onbekend') return object; 

    });

    
    const originNederlands = answerYes.filter( object => {

        if (object.herkomst == 'Nederlands'){

            originTotal.push(object);

            return object;
        }      
    });


    const complete = [];
    
    const originWesters = answerYes.filter(object => {

        if (object.herkomst == 'Westers'){

            originTotal.push(object);

            return object;
        }
    });

    

    console.log('westers', originWesters.length / answerYes.length * 100);

    const originNietWesters = answerYes.filter(object => {

        if(object.herkomst != 'Nederlands' && object.herkomst != 'Westers' && object.herkomst != 'Onbekend'){

            object.herkomst = 'niet-Westers';

            originTotal.push(object);

            return object;
        }
    });

    console.log('Nietwesters', originNietWesters.length / answerYes.length * 100);
    console.log('Nederlandsz', originNederlands.length / answerYes.length * 100);
    
    complete.push(checkInitiatedContact(originNietWesters, answerYes));
    complete.push(checkInitiatedContact(originNederlands, answerYes));
    complete.push(checkInitiatedContact(originWesters, answerYes));
    

    console.log(complete);

    // const target = {}
    // const target2 = {}

    // let flattened = complete.flat()

    // flattened.map(d => {
        
    //     if(d.contactZoeker == "De politie kwam naar mij toe") Object.assign(target, d)
    //     else if(d.contactZoeker == "Ik ging naar de politie toe") Object.assign(target2, d)
        
    // })

    // arrayForStack.push(target)
    // arrayForStack.push(target2)

    // console.log('stackdata: ', arrayForStack)

    return complete;

}

function checkInitiatedContact(data, answerYes){

    const policeContacted = [];
    const iContacted = [];

    let origin;

    data.forEach(element => {
        origin = element.herkomst;
    });

    data.map(object => {

        if(object.totStand == 'De politie kwam naar mij toe'){
            policeContacted.push(object.totStand);
        } else if(object.totStand == 'Ik ging naar de politie toe'){
            iContacted.push(object.totStand);
        }
    });

    // complete.push(policeContacted.length)
    // complete.push(iContacted.length)

    
    let cleanedObject = {origin: origin, policeContactedMe: policeContacted.length / answerYes.length * 100, iContactedPolice: iContacted.length / answerYes.length * 100, amountIContactedPolice: iContacted.length , amountPoliceContactedMe: policeContacted.length};
    // complete.push({contactZoeker: 'De politie kwam naar mij toe', [origin]: policeContacted.length / answerYes.length * 100})
    // complete.push({contactZoeker: 'Ik ging naar de politie toe', [origin]: iContacted.length / answerYes.length * 100})

    return cleanedObject;
}

function renderStackedBars(data){

    console.log('data: ', data);

    let stack = d3.stack()
        .keys(['iContactedPolice', 'policeContactedMe'])
        .order(d3.stackOrderAscending)
        .offset(d3.stackOffsetExpand);

    let stack2 = d3.stack()
        .keys(['amountIContactedPolice', 'amountPoliceContactedMe'])
        .order(d3.stackOrderAscending)
        .offset(d3.stackOffsetNone);

    let series = stack(data);

    let series2 = stack2(data);

    let transformToPercent = d3.format('.0%');

    console.log('series: ', series);

    console.log('series 2: ', series2);

    const svg = d3.select('.stack');

    const width = +svg.attr('width');
    const height = +svg.attr('height');

    const yValue = d => d.origin;

    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => {
            //console.log(d[1] - d[0] == d.data.iContactedPolice)

            // if(d[1] - d[0] == d.data.iContactedPolice ) console.log('dit wil je:', d)

            return '<h4> Nederlander met '  + d.data.origin + 'e' + ' migratieachtergrond</h4><strong>Percentage</strong> <span style=\'color:red\'>'+ transformToPercent((d[1] - d[0])) +'</span>';
        });

    const margin = { top: 40, right: 30, bottom: 150, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .range([0, innerWidth])
        .nice();

    const yScale = d3.scaleBand()
        .domain(data.map(yValue))
        .range([0, innerHeight])
        .padding(0.3);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    //append a new group for the y axis and set it on the left side
    g.append('g')
        .style('font-size', '1rem')
        .call(d3.axisLeft(yScale)
            .tickSize('0'));
    // .append('text')
    // .style('font-size', '1rem')
    // .style('transform', 'rotate(-90deg)')
    // .attr('y', innerHeight / 2)
    // // .attr('x', 500)
    // .attr('fill', 'white')
            
    // .text('Nederlanders');



    //append a new group for the x axis and set it at as the bottom axis
    g.append('g')
        .style('font-size', '1rem')
        .call(d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(transformToPercent))
        .style('stroke-dasharray', ('3, 3'))
        .attr('transform', `translate(0, ${innerHeight})`)
        .append('text')
        .style('font-size', '1rem')
        .attr('y', 40)
        .attr('x', innerWidth / 2)
        .attr('fill', 'white')
        .text('Percentage');

    //makes an ordinal color scale for each type
    const color = d3.scaleOrdinal()
        .range([ '#FFF33D', '#0048FF', ]);
        
    g.call(tip);

    g.append('g')
        .selectAll('g')
        .data(series)
        .join('g')
        .attr('fill', d => color(d.key))
        .selectAll('rect')
        .data(d => d)
        .join('rect')
        .attr('class', 'bar')
    //.attr("x", (d, i) => x(d.data.name))
        .attr('y', d => yScale(d.data.origin))
        .attr('x', d => xScale(d[0]))
        .attr('height', yScale.bandwidth())
        .attr('width', d => xScale(d[1]) - xScale(d[0]))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

    //g.selectAll("rect")
        
        .append('text')
        .attr('height', yScale.bandwidth())
        .attr('class', 'up')
        .attr('y', d => yScale(d.data.origin))
        .attr('x', d => xScale(d[0]))
        .attr('text-anchor', 'left')
        .text( d => transformToPercent(d[1] - d[0]))
        .style('fill', '#FFFFFF');

    const legend = svg.selectAll('.legend')
        .data(color.domain())
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; })
        .on('mouseenter', d => {
            console.log(d);
        });
    legend.append('rect')
        .attr('x', 630 + innerWidth /3)
        .attr('y', innerHeight / 2 +70)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', color);
    legend.append('text')
        .attr('x', 630 + innerWidth / 3)
        .attr('y', innerHeight / 2 + 79)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text( d => { if (d == 'iContactedPolice'){return 'Ik ging naar de politie toe';} else if(d == 'policeContactedMe'){ return 'De politie kwam naar mij toe';} })
        .attr('fill', 'white');

    function selectionChanged(){
        //change by click on radio button
        //chenge the normalised bars to stacked bars
        //stacked bars should have numbers 
        //x axis should have these numbers on axis
    }
            
          
}


        



const button1 = document.getElementById('button-step1');
const button2 = document.getElementById('button-step2');
const button3 = document.getElementById('button-step3');
const button4 = document.getElementById('button-step4');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

button1.addEventListener('click', function() {
    step1.classList.replace('hidden', 'visible');
    step2.classList.replace('visible', 'hidden');
    step3.classList.replace('visible', 'hidden');
    step4.classList.replace('visible', 'hidden');

    button1.classList.replace('inactive', 'active');
    button2.classList.replace('active', 'inactive');
    button3.classList.replace('active', 'inactive');
    button4.classList.replace('active', 'inactive');
});

button2.addEventListener('click', function() {
    step1.classList.replace('visible', 'hidden');
    step2.classList.replace('hidden', 'visible');
    step3.classList.replace('visible', 'hidden');
    step4.classList.replace('visible', 'hidden');

    button1.classList.replace('active', 'inactive');
    button2.classList.replace('inactive', 'active');
    button3.classList.replace('active', 'inactive');
    button4.classList.replace('active', 'inactive');
});

button3.addEventListener('click', function() {
    step1.classList.replace('visible', 'hidden');
    step2.classList.replace('visible', 'hidden');
    step3.classList.replace('hidden', 'visible');
    step4.classList.replace('visible', 'hidden');

    button1.classList.replace('active', 'inactive');
    button2.classList.replace('active', 'inactive');
    button3.classList.replace('inactive', 'active');
    button4.classList.replace('active', 'inactive');
});

button4.addEventListener('click', function() {
    step1.classList.replace('visible', 'hidden');
    step2.classList.replace('visible', 'hidden');
    step3.classList.replace('visible', 'hidden');
    step4.classList.replace('hidden', 'visible');

    button1.classList.replace('active', 'inactive');
    button2.classList.replace('active', 'inactive');
    button3.classList.replace('active', 'inactive');
    button4.classList.replace('inactive', 'active');
});
