#!/usr/bin/env perl

use common::sense;

use Data::Dumper;
$Data::Dumper::Sortkeys = 1;


while(1) {
  my $v = {};

  $v->{PRICE1} = 6 + int(rand(93));
  $v->{PRICE2} = $v->{PRICE1} - int(rand($v->{PRICE1} - 1)) - 1;
  $v->{PRICE3} = int(rand(90));
  $v->{PRICE4} = $v->{PRICE3} + int(rand(99 - $v->{PRICE3}));

  $v->{TRADE_O1} = 3 + int(rand(2));
  $v->{TRADE_O2} = 1 + int(rand(2));
  $v->{TRADE_O3} = 1 + int(rand(4));

  $v->{TRADE_A1} = rand(1);
  $v->{TRADE_A2} = rand(1);
  $v->{TRADE_A3} = rand(1);

  print Dumper($v);

  foreach my $k (keys %$v) {
    $ENV{$k} = $v->{$k};
  }

  my $ret = system("node t/fuzz/fuzzMatch.js");
  if ($ret) {
    print Dumper($v);
    exit 1;
  }
}
