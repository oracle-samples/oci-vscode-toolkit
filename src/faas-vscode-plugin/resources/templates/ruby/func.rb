require 'fdk'

def myfunction(context:, input:)
  input_value = input.respond_to?(:fetch) ? input.fetch('name') : input
  name = input_value.to_s.strip.empty? ? 'World' : input_value
  FDK.log(entry: "Inside Ruby Hello World function")
  { message: "Hello #{name}!" }
end

FDK.handle(target: :myfunction)
