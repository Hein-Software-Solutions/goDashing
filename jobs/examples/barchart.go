package gojobs

import (
	"math/rand"
	"time"

	"goDashing"
)

type samplebar struct{}

func (j *samplebar) Work(send chan *dashing.Event, webroot string, url string, token string) {
	ticker := time.NewTicker(1 * time.Second)

	for {
		select {
		case <-ticker.C:

			send <- dashing.NewEvent("test", map[string]interface{}{
				"labels": []string{"January", "February", "March", "April", "May", "June", "July"},
				"datasets": []map[string]interface{}{
					{
						"label":           "My First dataset",
						"fillColor":       "rgba(220,220,220,0.5)",
						"strokeColor":     "rgba(220,220,220,0.8)",
						"highlightFill":   "rgba(220,220,220,0.75)",
						"highlightStroke": "rgba(220,220,220,1)",
						"data":            []int{rand.Intn(60), rand.Intn(42), rand.Intn(82), rand.Intn(13), rand.Intn(57), 5, 57},
					}, {
						"label":           "My Second dataset",
						"fillColor":       "rgba(151,187,205,0.5)",
						"strokeColor":     "rgba(151,187,205,0.8)",
						"highlightFill":   "rgba(151,187,205,0.75)",
						"highlightStroke": "rgba(151,187,205,1)",
						"data":            []int{60, rand.Intn(80), 62, rand.Intn(63), 67, rand.Intn(50), 57},
					},
				},
				"options": map[string]string{"scaleFontColor": "#fff"},
			}, "")

		}
	}
}

func init() {
	dashing.Register(&samplebar{})
}
