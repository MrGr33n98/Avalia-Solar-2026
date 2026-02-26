puts '--- RANKING ORDER ---'
Company.ordered_by_priority.limit(5).each_with_index do |c, i|
  puts "#{i+1}. #{c.name.ljust(25)} | Score: #{c.calculate_ranking_score.to_s.ljust(10)} | Sponsored: #{c.sponsored}"
end

puts '--- CALCULATION TEST ---'
c = Company.find_by(name: 'Alpha Solar Pro')
if c
  puts "Alpha Solar Pro - Priority: #{c.priority_score}, Sponsored: #{c.sponsored}, Rating: #{c.rating_avg}"
  puts "Calculated Score: #{c.calculate_ranking_score}"
else
  puts "Company not found!"
end
