begin
  b = Banner.new(target_states: 'SP, RJ')
  File.write('test_out.txt', "Success: #{b.target_states.class.name}")
rescue Exception => e
  File.write('test_out.txt', "Error: #{e.class} - #{e.message}\n#{e.backtrace.first(10).join("\n")}")
end
