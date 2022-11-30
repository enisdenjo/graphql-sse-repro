package com.example.demo;

import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment;
import com.netflix.graphql.dgs.DgsQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;

@DgsComponent
public class SDLQuery {

    @Autowired
    private ApplicationContext applicationContext;

    @DgsQuery(field = "_sdl")
   public String sdlDataFetcher(final DgsDataFetchingEnvironment dfe) throws IOException {
        return readResourceAsString("classpath:/schema/schema.graphqls");
    }

    public String readResourceAsString(String location) throws IOException {
        var resource = applicationContext.getResource(location);
        String resourceAsString = null;
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            resourceAsString = FileCopyUtils.copyToString(reader);
        }
        return resourceAsString;
    }
}
