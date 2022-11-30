package com.example.demo;

import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsSubscription;

import java.time.Duration;

import org.reactivestreams.Publisher;
import reactor.core.publisher.Flux;

@DgsComponent
public class StockPublisher {
    @DgsSubscription
    public Publisher<Stock> stocks() {
        return Flux.interval(Duration.ofSeconds(1)).map(t -> Stock.builder().price(t).name("TEST").build());
    }
}
