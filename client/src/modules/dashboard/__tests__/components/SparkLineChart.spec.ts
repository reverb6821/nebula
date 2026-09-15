import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SparkLineChart from '../../components/SparkLineChart.vue'

describe('SparkLineChart', () => {
  it('renders one polyline per series and clamps values to the chart bounds', () => {
    const wrapper = mount(SparkLineChart, {
      props: {
        series: [{ id: 'cpu', color: 'red', values: [-10, 50, 120] }],
        max: 100,
        height: 100,
        windowSeconds: 3,
      },
    })

    const polyline = wrapper.find('polyline')
    expect(wrapper.findAll('polyline')).toHaveLength(1)
    expect(polyline.attributes('stroke')).toBe('red')
    expect(polyline.attributes('points')).toBe('0.0,100.0 350.0,50.0 700.0,0.0')
  })

  it('renders y-axis values using the supplied formatter', () => {
    const wrapper = mount(SparkLineChart, {
      props: {
        series: [],
        max: 100,
        formatY: (value: number) => `${value} units`,
      },
    })

    expect(wrapper.text()).toContain('100 units')
    expect(wrapper.text()).toContain('50 units')
    expect(wrapper.text()).toContain('0 units')
  })

  it('formats minute x-axis labels when the window reaches one minute', () => {
    const wrapper = mount(SparkLineChart, {
      props: { series: [], max: 100, windowSeconds: 60, xLabelStep: 30 },
    })

    expect(wrapper.text()).toContain('1 min')
    expect(wrapper.text()).toContain('30 sec')
  })
})
