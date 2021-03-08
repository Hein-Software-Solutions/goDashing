package gojobs

import (
	"math/rand"
	"time"

	"goDashing"
)

type doughnutchart struct{}

func (j *doughnutchart) Work(send chan *dashing.Event, webroot string, url string, token string) {
	ticker := time.NewTicker(1 * time.Second)

	for {
		select {
		case <-ticker.C:

			send <- dashing.NewEvent("doughnutchart", map[string]interface{}{
				"segments": []map[string]interface{}{
					{
						"value":     rand.Intn(20),
						"color":     "#F7464A",
						"highlight": "#FF5A5E",
						"label":     "January",
					},
					{
						"value":     rand.Intn(30),
						"color":     "#46BFBD",
						"highlight": "#5AD3D1",
						"label":     "February",
					}, {
						"value":     rand.Intn(30),
						"color":     "#FDB45C",
						"highlight": "#FFC870",
						"label":     "March",
					}, {
						"value":     rand.Intn(30),
						"color":     "#949FB1",
						"highlight": "#A8B3C5",
						"label":     "April",
					}, {
						"value":     rand.Intn(30),
						"color":     "#4D5360",
						"highlight": "#4D5360",
						"label":     "April",
					},
				},
				"options": map[string]string{"segmentStrokeColor": "#333"},
			}, "")

		}
	}
}

func init() {
	dashing.Register(&doughnutchart{})
}
