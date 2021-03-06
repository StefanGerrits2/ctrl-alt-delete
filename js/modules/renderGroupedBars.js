export default function renderGroupedBarChart(data) {
    const svg = d3.select('.groupedBars');

    const width = +svg.attr('width');
    const height = +svg.attr('height');

    //const yValue = d => d.origin;
    const margin = { top: 40, right: 30, bottom: 150, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', [0, 0, width, height]);

    const keys = ['Nederlands', 'Westers', 'niet-Westers'];
    const groupKey = 'stelling';

    // const formatXScale = d3.format(',.0f');

    const y0 = d3.scaleBand()
        .domain(data.map(d => d[groupKey]))
        .rangeRound([0, innerHeight ])
        .paddingInner(0.1);

    const y1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, y0.bandwidth()])
        .padding(0.10);

    const xScale = d3.scaleLinear()
        .domain([0, 5]).nice()
        .range([0, innerWidth])
        .nice();

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    //append a new group for the y axis and set it on the left side
    g.append('g')
        .style('font-size', '1rem')
        .call(d3.axisLeft(y0)
            .tickSize('0'));

    g.append('g')
        .style('font-size', '1rem')
        .call(d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickValues([0, 1, 2, 3, 4, 5]))
        .style('stroke-dasharray', ('3, 3'))
        .attr('transform', `translate(0, ${innerHeight})`)
        .append('text')
        .style('font-size', '1rem')
        .attr('y', 40)
        .attr('x', innerWidth / 2)
        .attr('fill', 'white')
        .text('Gemiddelde score');

    //makes an ordinal color scale for each type
    const color = d3.scaleOrdinal()
        .range([ '#494CA2', '#8186d5', '#c6cbef']);
    
    // g.call(tip);

    g.append('g')
        .selectAll('g')
        .data(data)
        .join('g')
        .attr('transform', d => `translate(0,${y0(d[groupKey])})`)
        .selectAll('rect')
        .data(d => keys.map(key => ({key, value: d[key]})))
        .join('rect')
        .attr('y', d => y1(d.key))
        .attr('x', d => xScale(d))
        .attr('height', y1.bandwidth())
        .attr('width', d => xScale(d.value) - xScale(0))
        .attr('fill', d => color(d.key));
}